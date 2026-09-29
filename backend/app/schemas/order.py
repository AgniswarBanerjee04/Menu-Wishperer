from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class OrderCreate(BaseModel):
    restaurant_name: str = Field(..., min_length=1)
    dish_name: str = Field(..., min_length=1)
    price: Optional[float] = Field(None, ge=0)
    rating: int = Field(..., ge=1, le=5, description="1 to 5 stars")
    note: Optional[str] = None
    session_id: Optional[int] = None

class OrderOut(BaseModel):
    id: int
    user_id: int
    restaurant_name: str
    dish_name: str
    price: Optional[float] = None
    rating: int
    note: Optional[str] = None
    session_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class InsightsResponse(BaseModel):
    total_orders: int
    average_rating: float
    average_spend: float
    favorite_cuisines: List[str]
    highest_rated_dishes: List[Dict[str, str]]
    rating_distribution: Dict[int, int]
