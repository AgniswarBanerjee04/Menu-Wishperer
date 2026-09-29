from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Stored as JSON arrays: e.g. ["Vegetarian", "Gluten-Free", "Nut Allergy"]
    dietary_restrictions = Column(JSON, default=list, nullable=False)
    
    # "none", "mild", "medium", "high", "extreme"
    spice_tolerance = Column(String(50), default="medium", nullable=False)
    
    # Stored as JSON arrays: e.g. ["Italian", "Mexican", "Thai"]
    cuisines_liked = Column(JSON, default=list, nullable=False)
    
    # Stored as JSON arrays: e.g. ["Seafood", "Fast Food"]
    cuisines_disliked = Column(JSON, default=list, nullable=False)
    
    default_budget_min = Column(Float, default=10.0, nullable=False)
    default_budget_max = Column(Float, default=40.0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="preferences")
