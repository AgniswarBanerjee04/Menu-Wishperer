from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class OrderHistory(Base):
    __tablename__ = "order_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id", ondelete="SET NULL"), nullable=True)
    restaurant_name = Column(String(255), nullable=False)
    session_id = Column(Integer, ForeignKey("menu_sessions.id", ondelete="SET NULL"), nullable=True)
    
    dish_name = Column(String(255), nullable=False)
    price = Column(Float, nullable=True)
    rating = Column(Integer, nullable=False, index=True)  # 1 to 5
    note = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
