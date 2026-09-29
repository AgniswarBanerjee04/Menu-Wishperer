from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models.user import User
from app.models.restaurant import Restaurant
from app.models.order import OrderHistory
from app.schemas.order import OrderCreate, OrderOut, InsightsResponse
from app.utils.dependencies import get_current_user

router = APIRouter(tags=["Orders & History"])

@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Lookup or create restaurant record
    rest_stmt = select(Restaurant).where(func.lower(Restaurant.name) == payload.restaurant_name.lower().strip())
    restaurant = await db.scalar(rest_stmt)
    if not restaurant:
        restaurant = Restaurant(name=payload.restaurant_name.strip())
        db.add(restaurant)
        await db.flush()

    new_order = OrderHistory(
        user_id=current_user.id,
        restaurant_id=restaurant.id if restaurant else None,
        restaurant_name=payload.restaurant_name.strip(),
        session_id=payload.session_id,
        dish_name=payload.dish_name.strip(),
        price=payload.price,
        rating=payload.rating,
        note=payload.note.strip() if payload.note else None
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    return new_order

@router.get("/orders", response_model=List[OrderOut])
async def list_orders(
    search: Optional[str] = Query(None, description="Search by dish name or restaurant"),
    min_rating: Optional[int] = Query(None, ge=1, le=5),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(OrderHistory).where(OrderHistory.user_id == current_user.id)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            (func.lower(OrderHistory.dish_name).like(term)) |
            (func.lower(OrderHistory.restaurant_name).like(term))
        )

    if min_rating:
        stmt = stmt.where(OrderHistory.rating >= min_rating)

    stmt = stmt.order_by(desc(OrderHistory.created_at)).limit(limit).offset(offset)
    result = await db.execute(stmt)
    orders = result.scalars().all()
    return orders

@router.get("/insights", response_model=InsightsResponse)
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(OrderHistory).where(OrderHistory.user_id == current_user.id).order_by(desc(OrderHistory.created_at))
    result = await db.execute(stmt)
    orders = result.scalars().all()

    total_orders = len(orders)
    if total_orders == 0:
        return InsightsResponse(
            total_orders=0,
            average_rating=0.0,
            average_spend=0.0,
            favorite_cuisines=current_user.preferences.cuisines_liked if current_user.preferences else ["North Indian", "Mughlai", "Tandoor"],
            highest_rated_dishes=[],
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        )

    avg_rating = round(sum(o.rating for o in orders) / total_orders, 1)
    
    priced_orders = [o.price for o in orders if o.price is not None]
    avg_spend = round(sum(priced_orders) / len(priced_orders), 2) if priced_orders else 0.0

    # Rating distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for o in orders:
        if o.rating in distribution:
            distribution[o.rating] += 1

    # Top rated dishes
    top_dishes = [
        {"name": o.dish_name, "restaurant": o.restaurant_name, "rating": str(o.rating)}
        for o in sorted(orders, key=lambda x: x.rating, reverse=True)
        if o.rating >= 4
    ][:5]

    # Cuisines from user preference or restaurant names
    fav_cuisines = (
        current_user.preferences.cuisines_liked
        if current_user.preferences and current_user.preferences.cuisines_liked
        else ["North Indian", "Mughlai", "Street Food / Chaat", "Tandoor"]
    )

    return InsightsResponse(
        total_orders=total_orders,
        average_rating=avg_rating,
        average_spend=avg_spend,
        favorite_cuisines=fav_cuisines,
        highest_rated_dishes=top_dishes,
        rating_distribution=distribution
    )
