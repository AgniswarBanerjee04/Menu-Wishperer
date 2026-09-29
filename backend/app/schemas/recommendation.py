from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from app.schemas.menu import ExtractedDish

class DishRecommendation(BaseModel):
    dish_name: str
    description: Optional[str] = None
    price: Optional[float] = None
    currency: str = "INR"
    category: Optional[str] = None
    dietary: str = Field("veg", description="veg | non-veg | egg | unknown")
    spice_level: Optional[str] = Field(None, description="mild | medium | spicy")
    match_score: int = Field(..., ge=0, le=100, description="Match score from 0 to 100")
    reasoning: str = Field(..., description="1-2 sentences tying dish to mood and taste profile")
    warnings: Optional[str] = Field(None, description="Allergen, ingredient, or spice warning")

class GuestProfile(BaseModel):
    id: str = Field(..., description="Unique identifier for the guest")
    name: str = Field(..., description="Label or name of the guest e.g. Dad, Mom, Aarav")
    dietary: str = Field(default="veg", description="veg | non-veg | egg | jain | gluten-free")
    spice_level: str = Field(default="medium", description="mild | medium | spicy")
    max_budget: Optional[float] = Field(default=None, description="Optional cap in INR per person")

class GuestBillBreakdown(BaseModel):
    guest_id: str
    guest_name: str
    allocated_cost: float
    budget_cap: Optional[float] = None
    is_within_budget: bool = True
    recommended_dishes: List[str] = Field(default_factory=list)

class GroupBillEstimate(BaseModel):
    total_cost: float
    total_budget: float
    per_person_average: float
    breakdown: List[GuestBillBreakdown] = Field(default_factory=list)
    is_within_budget: bool = True

class RecommendRequest(BaseModel):
    session_id: Optional[int] = None
    restaurant_name: Optional[str] = None
    dishes: List[ExtractedDish] = Field(..., min_length=1, description="List of candidate dishes")
    mood: str = Field(default="comfort_food", description="light, comfort_food, adventurous, healthy, celebrating")
    budget: float = Field(default=500.0, ge=1.0, description="Budget for this meal in INR")
    hunger_level: str = Field(default="moderate", description="snack, moderate, starving")
    mode: str = Field(default="personal", description="personal | custom")
    venue_type: Optional[str] = Field(default="restaurant", description="cafe | restaurant")
    guests: Optional[List[GuestProfile]] = Field(default=None, description="Guest profiles for custom group dining")

class RecommendResponse(BaseModel):
    session_id: Optional[int] = None
    restaurant_name: Optional[str] = None
    mood: str
    budget: float
    hunger_level: str
    mode: str = "personal"
    venue_type: Optional[str] = "restaurant"
    recommendations: List[DishRecommendation] = Field(default_factory=list)
    guests: Optional[List[GuestProfile]] = None
    guest_recommendations: Optional[Dict[str, List[DishRecommendation]]] = None
    table_share_recommendations: Optional[List[DishRecommendation]] = None
    group_bill_estimate: Optional[GroupBillEstimate] = None
    disclaimer: str = (
        "AI suggestions are for guidance only. Ingredients and preparation can change. "
        "Never consider any dish 100% allergen-free without verifying directly with restaurant staff."
    )

