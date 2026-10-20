from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, Float, JSON
from app.database import Base

class ScreeningRecord(Base):
    __tablename__ = "screenings"

    id = Column(String, primary_key=True, index=True)
    child_id = Column(String, index=True, nullable=False)
    date = Column(String, default=lambda: datetime.utcnow().isoformat())
    status = Column(String, default="completed")
    assessment_type = Column(String, default="M-CHAT-R Screening")
    
    # Scores & Results
    total_score = Column(Integer, default=0)
    max_score = Column(Integer, default=60)
    probability = Column(Integer, default=0)
    likelihood = Column(String, default="low") # low, elevated, high
    
    # JSON payload details
    domain_scores = Column(JSON, default=dict)
    answers = Column(JSON, default=dict)
    recommendations = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.utcnow)
