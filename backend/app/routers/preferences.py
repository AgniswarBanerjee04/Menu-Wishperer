from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.preference import UserPreference
from app.schemas.preference import PreferenceCreate, PreferenceUpdate, PreferenceOut
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/me/preferences", tags=["Preferences"])

@router.get("", response_model=PreferenceOut)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    pref = await db.scalar(stmt)
    if not pref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User preferences have not been set yet"
        )
    return pref

@router.put("", response_model=PreferenceOut)
async def update_my_preferences(
    payload: PreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    pref = await db.scalar(stmt)
    
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            dietary_restrictions=payload.dietary_restrictions,
            spice_tolerance=payload.spice_tolerance,
            cuisines_liked=payload.cuisines_liked,
            cuisines_disliked=payload.cuisines_disliked,
            default_budget_min=payload.default_budget_min,
            default_budget_max=payload.default_budget_max,
            currency=payload.currency
        )
        db.add(pref)
    else:
        pref.dietary_restrictions = payload.dietary_restrictions
        pref.spice_tolerance = payload.spice_tolerance
        pref.cuisines_liked = payload.cuisines_liked
        pref.cuisines_disliked = payload.cuisines_disliked
        pref.default_budget_min = payload.default_budget_min
        pref.default_budget_max = payload.default_budget_max
        pref.currency = payload.currency
        
    await db.commit()
    await db.refresh(pref)
    return pref
