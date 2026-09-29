import uuid
from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedDish(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: f"dish_{uuid.uuid4().hex[:8]}", description="Unique identifier for dish")
    name: str = Field(..., description="Name of dish")
    description: Optional[str] = Field(None, description="Ingredients, flavor notes, or portion sizing")
    price: Optional[float] = Field(None, description="Price in INR")
    currency: str = Field("INR", description="Currency code (e.g. INR)")
    category: Optional[str] = Field("Main Course", description="Starters, Noodles, Fried Rice, Curries, Breads, Desserts, Beverages, etc.")
    dietary: str = Field("veg", description="Dietary classification: veg, non-veg, or egg")
    spice_level: Optional[str] = Field(None, description="Spice level: mild, medium, or spicy")

class MenuExtractRequestText(BaseModel):
    restaurant_name: Optional[str] = Field(None, description="Optional restaurant name")
    text: str = Field(..., min_length=5, description="Pasted raw menu text")
    venue_type: Optional[str] = Field("restaurant", description="cafe | restaurant")
    dining_mode: Optional[str] = Field("personal", description="personal | custom")

class MenuExtractRequestQR(BaseModel):
    url: str = Field(..., min_length=4, description="Scanned table QR code URL")
    restaurant_name: Optional[str] = Field(None, description="Optional restaurant name")
    venue_type: Optional[str] = Field("restaurant", description="cafe | restaurant")
    dining_mode: Optional[str] = Field("personal", description="personal | custom")

class MenuExtractResponse(BaseModel):
    session_id: int
    restaurant_name: Optional[str] = None
    raw_input_type: str  # "image", "text", or "qr"
    venue_type: Optional[str] = "restaurant"
    dining_mode: Optional[str] = "personal"
    dishes: List[ExtractedDish]
