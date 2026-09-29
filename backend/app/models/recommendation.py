from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("menu_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    dish_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    category = Column(String(100), nullable=True)
    
    match_score = Column(Integer, nullable=False)  # 0 to 100
    reasoning = Column(Text, nullable=False)        # 1-2 personalized sentences
    warnings = Column(Text, nullable=True)         # Allergen, dietary, or spice warnings
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("MenuSession", back_populates="recommendations")
