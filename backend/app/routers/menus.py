import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Body
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.session import MenuSession
from app.models.preference import UserPreference
from app.models.order import OrderHistory
from app.models.recommendation import Recommendation
from app.schemas.menu import MenuExtractResponse, MenuExtractRequestText, MenuExtractRequestQR, ExtractedDish
from app.schemas.recommendation import RecommendRequest, RecommendResponse
from app.services.rate_limiter import rate_limiter
from app.services.gemini_service import gemini_service
from app.services.qr_ingestion_service import qr_ingestion_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/menus", tags=["Menus"])

@router.post("/extract", response_model=MenuExtractResponse)
async def extract_menu(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    restaurant_name: Optional[str] = Form(None),
    venue_type: Optional[str] = Form("restaurant"),
    dining_mode: Optional[str] = Form("personal"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Rate limit check per user
    rate_limiter.check_rate_limit(current_user.id, max_requests=settings.AI_RATE_LIMIT_PER_MINUTE)

    raw_input_type = "text"
    image_path = None
    extracted_result = None

    if file:
        raw_input_type = "image"
        # Validate content type
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{file.content_type}'. Please upload JPEG, PNG, or WEBP."
            )
        
        # Read file contents & validate size
        contents = await file.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image file exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB."
            )

        # Save to uploads folder
        ext = os.path.splitext(file.filename or "")[1] or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        saved_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(saved_path, "wb") as f:
            f.write(contents)
        image_path = saved_path

        # Call Gemini Vision extraction with venue intelligence
        extracted_result = await gemini_service.extract_menu_from_image(
            image_bytes=contents,
            mime_type=file.content_type,
            filename=file.filename or "menu.jpg",
            venue_type=venue_type or "restaurant"
        )
        if not restaurant_name and extracted_result.restaurant_name:
            restaurant_name = extracted_result.restaurant_name

    elif text and text.strip():
        raw_input_type = "text"
        extracted_result = await gemini_service.extract_menu_from_text(
            text=text.strip(),
            restaurant_name=restaurant_name,
            venue_type=venue_type or "restaurant"
        )
        if not restaurant_name and extracted_result.restaurant_name:
            restaurant_name = extracted_result.restaurant_name
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either a menu photo file or menu text."
        )

    # Save Session in Database
    dishes_dict_list = [dish.model_dump() for dish in extracted_result.dishes]
    session = MenuSession(
        user_id=current_user.id,
        restaurant_name=restaurant_name or "Restaurant",
        raw_input_type=raw_input_type,
        image_path=image_path,
        raw_text=text if raw_input_type == "text" else None,
        extracted_dishes=dishes_dict_list,
        venue_type=venue_type or "restaurant",
        dining_mode=dining_mode or "personal"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return MenuExtractResponse(
        session_id=session.id,
        restaurant_name=session.restaurant_name,
        raw_input_type=raw_input_type,
        venue_type=session.venue_type,
        dining_mode=session.dining_mode,
        dishes=extracted_result.dishes
    )

@router.post("/extract-text", response_model=MenuExtractResponse)
async def extract_menu_text_json(
    payload: MenuExtractRequestText,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Convenience endpoint accepting JSON body for text menus."""
    rate_limiter.check_rate_limit(current_user.id, max_requests=settings.AI_RATE_LIMIT_PER_MINUTE)

    extracted_result = await gemini_service.extract_menu_from_text(
        text=payload.text,
        restaurant_name=payload.restaurant_name,
        venue_type=payload.venue_type or "restaurant"
    )

    dishes_dict_list = [dish.model_dump() for dish in extracted_result.dishes]
    session = MenuSession(
        user_id=current_user.id,
        restaurant_name=payload.restaurant_name or extracted_result.restaurant_name or "Restaurant",
        raw_input_type="text",
        raw_text=payload.text,
        extracted_dishes=dishes_dict_list,
        venue_type=payload.venue_type or "restaurant",
        dining_mode=payload.dining_mode or "personal"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return MenuExtractResponse(
        session_id=session.id,
        restaurant_name=session.restaurant_name,
        raw_input_type="text",
        venue_type=session.venue_type,
        dining_mode=session.dining_mode,
        dishes=extracted_result.dishes
    )

@router.post("/qr-ingest", response_model=MenuExtractResponse)
@router.post("/extract-qr", response_model=MenuExtractResponse)
async def extract_menu_from_qr_url(
    payload: MenuExtractRequestQR,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest a digital menu via scanned table QR code URL:
    - Resolves link and bypasses client CORS
    - Scrapes HTML, parses Next.js/JSON-LD ordering catalogs, or extracts PDF/image
    - Normalizes dishes into standard schema via Gemini LLM
    """
    rate_limiter.check_rate_limit(current_user.id, max_requests=settings.AI_RATE_LIMIT_PER_MINUTE)

    # Step A: Link Resolution & Content Fetching
    content_type, content_data, detected_name = await qr_ingestion_service.fetch_url_content(payload.url)

    # Step B: LLM Menu Normalization
    restaurant_name_hint = payload.restaurant_name or detected_name
    final_restaurant_name, dishes = await qr_ingestion_service.extract_menu_from_qr_data(
        content_type=content_type,
        content_data=content_data,
        provided_name=restaurant_name_hint,
        venue_type=payload.venue_type or "restaurant"
    )

    if not dishes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to extract menu items from this digital link. The restaurant portal may require app installation or login."
        )

    # Persist MenuSession
    dishes_dict_list = [d.model_dump() for d in dishes]
    session = MenuSession(
        user_id=current_user.id,
        restaurant_name=final_restaurant_name or "Table QR Menu",
        raw_input_type="qr",
        raw_text=payload.url,
        extracted_dishes=dishes_dict_list,
        venue_type=payload.venue_type or "restaurant",
        dining_mode=payload.dining_mode or "personal"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return MenuExtractResponse(
        session_id=session.id,
        restaurant_name=session.restaurant_name,
        raw_input_type="qr",
        venue_type=session.venue_type,
        dining_mode=session.dining_mode,
        dishes=dishes
    )

@router.post("/recommend", response_model=RecommendResponse)
async def get_menu_recommendations(
    payload: RecommendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    rate_limiter.check_rate_limit(current_user.id, max_requests=settings.AI_RATE_LIMIT_PER_MINUTE)

    # 1. Fetch user preferences
    pref_stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    user_pref = await db.scalar(pref_stmt)
    
    dietary_restrictions = user_pref.dietary_restrictions if user_pref else []
    spice_tolerance = user_pref.spice_tolerance if user_pref else "medium"
    cuisines_liked = user_pref.cuisines_liked if user_pref else []
    cuisines_disliked = user_pref.cuisines_disliked if user_pref else []

    # 2. Fetch past orders for personalization loop
    orders_stmt = (
        select(OrderHistory)
        .where(OrderHistory.user_id == current_user.id)
        .order_by(desc(OrderHistory.created_at))
        .limit(15)
    )
    orders_result = await db.execute(orders_stmt)
    past_orders = orders_result.scalars().all()

    top_past_dishes = [o.dish_name for o in past_orders if o.rating >= 4]
    disliked_past_dishes = [o.dish_name for o in past_orders if o.rating <= 2]

    # 3. Call Gemini recommendation engine (Personal vs Custom Group) with Venue Intelligence
    if payload.mode == "custom" and payload.guests:
        guest_recs, table_shares, group_bill, all_recs = await gemini_service.recommend_for_guests(
            dishes=payload.dishes,
            mood=payload.mood,
            budget=payload.budget,
            hunger_level=payload.hunger_level,
            guests=payload.guests,
            cuisines_liked=cuisines_liked,
            cuisines_disliked=cuisines_disliked,
            venue_type=payload.venue_type or "restaurant"
        )
        recommendations = all_recs
        guest_recommendations = guest_recs
        table_share_recommendations = table_shares
        group_bill_estimate = group_bill
    else:
        recommendations = await gemini_service.recommend_dishes(
            dishes=payload.dishes,
            mood=payload.mood,
            budget=payload.budget,
            hunger_level=payload.hunger_level,
            dietary_restrictions=dietary_restrictions,
            spice_tolerance=spice_tolerance,
            cuisines_liked=cuisines_liked,
            cuisines_disliked=cuisines_disliked,
            top_past_dishes=top_past_dishes,
            disliked_past_dishes=disliked_past_dishes,
            venue_type=payload.venue_type or "restaurant"
        )
        guest_recommendations = None
        table_share_recommendations = None
        group_bill_estimate = None

    # 4. If session_id provided, update session context and persist recommendations
    restaurant_name = payload.restaurant_name
    if payload.session_id:
        session_stmt = select(MenuSession).where(
            MenuSession.id == payload.session_id,
            MenuSession.user_id == current_user.id
        )
        session = await db.scalar(session_stmt)
        if session:
            session.mood = payload.mood
            session.budget = payload.budget
            session.hunger_level = payload.hunger_level
            session.venue_type = payload.venue_type or session.venue_type
            session.dining_mode = payload.mode
            if not restaurant_name:
                restaurant_name = session.restaurant_name

            # Persist recommendations
            for rec in recommendations:
                rec_record = Recommendation(
                    session_id=session.id,
                    dish_name=rec.dish_name,
                    description=rec.description,
                    price=rec.price,
                    category=rec.category,
                    match_score=rec.match_score,
                    reasoning=rec.reasoning,
                    warnings=rec.warnings
                )
                db.add(rec_record)
            await db.commit()

    return RecommendResponse(
        session_id=payload.session_id,
        restaurant_name=restaurant_name,
        mood=payload.mood,
        budget=payload.budget,
        hunger_level=payload.hunger_level,
        mode=payload.mode,
        venue_type=payload.venue_type or "restaurant",
        guests=payload.guests,
        recommendations=recommendations,
        guest_recommendations=guest_recommendations,
        table_share_recommendations=table_share_recommendations,
        group_bill_estimate=group_bill_estimate,
        disclaimer=(
            "AI suggestions are for guidance only. Ingredients and preparation can change. "
            "Never consider any dish 100% allergen-free without verifying directly with restaurant staff."
        )
    )

