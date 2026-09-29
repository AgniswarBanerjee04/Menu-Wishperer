from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class PreferenceBase(BaseModel):
    dietary_restrictions: List[str] = Field(
        default_factory=lambda: ["Vegetarian"],
        description="e.g. Vegetarian, Non-Vegetarian, Jain, Halal, Nut Allergy, Gluten-Free"
    )
    spice_tolerance: str = Field(default="medium", description="none, mild, medium, high, extreme")
    cuisines_liked: List[str] = Field(
        default_factory=lambda: ["North Indian", "Mughlai", "Street Food / Chaat", "Tandoor"],
        description="e.g. North Indian, South Indian, Mughlai, Street Food, Tandoor, Coastal, Biryani"
    )
    cuisines_disliked: List[str] = Field(default_factory=list, description="e.g. Fast Food")
    default_budget_min: float = Field(default=150.0, ge=0)
    default_budget_max: float = Field(default=800.0, ge=0)
    currency: str = Field(default="INR", max_length=10)

class PreferenceCreate(PreferenceBase):
    pass

class PreferenceUpdate(PreferenceBase):
    pass

class PreferenceOut(PreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
