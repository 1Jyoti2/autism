from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship as orm_relationship
from app.database import Base

class Child(Base):
    __tablename__ = "children"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    date_of_birth = Column(String, nullable=False)  # ISO YYYY-MM-DD
    gender = Column(String, nullable=False)          # male, female, other
    caregiver_name = Column(String, nullable=True)
    relationship = Column(String, default="parent")
    notes = Column(Text, nullable=True)
    avatar_color = Column(String, default="#0d9488")
    status = Column(String, default="Completed")     # Completed, Needs Review, Pending
    risk_level = Column(String, default="Low")       # Low, Medium, High
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relational link to User profile
    user = orm_relationship("User", backref="children", lazy="joined")
