from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class MenuSession(Base):
    __tablename__ = "menu_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="SET NULL"), nullable=True)
    restaurant_name = Column(String(255), nullable=True)
    
    # "image" or "text"
    raw_input_type = Column(String(50), default="text", nullable=False)
    image_path = Column(String(500), nullable=True)
    raw_text = Column(Text, nullable=True)
    
    # Structured dishes extracted: [{name, description, price, category}]
    extracted_dishes = Column(JSON, default=list, nullable=False)
    
    # Session context
    # "light", "comfort_food", "adventurous", "healthy", "celebrating"
    mood = Column(String(50), nullable=True)
    budget = Column(Float, nullable=True)
    # "snack", "moderate", "starving"
    hunger_level = Column(String(50), nullable=True)
    
    # Concierge context: "cafe" vs "restaurant", "personal" vs "custom"
    venue_type = Column(String(50), default="restaurant", nullable=True)
    dining_mode = Column(String(50), default="personal", nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="sessions")
    restaurant = relationship("Restaurant", back_populates="sessions")
    recommendations = relationship("Recommendation", back_populates="session", cascade="all, delete-orphan")
