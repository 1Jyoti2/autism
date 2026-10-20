from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Boolean, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    child_id = Column(String, ForeignKey("children.id", ondelete="SET NULL"), nullable=True, index=True)
    file_id = Column(String, ForeignKey("uploaded_files.id", ondelete="SET NULL"), nullable=True, index=True)

    model_name = Column(String, nullable=False, default="emotion_resnet18")
    model_version = Column(String, nullable=False, default="1.0.0")
    assessment_type = Column(String, nullable=False, index=True)  # "Image Analysis" or "Video Analysis"
    
    predicted_class = Column(String, nullable=False, index=True)
    predicted_behavior_key = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=False, index=True)
    has_autism_signs = Column(Boolean, default=False, index=True)
    
    status = Column(String, nullable=False)
    status_tone = Column(String, default="neutral")
    explanation = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    
    raw_probabilities = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="predictions")
    child = relationship("Child")
    file = relationship("UploadedFile", back_populates="predictions")
    history_entries = relationship("PredictionHistory", back_populates="prediction", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_predictions_child_type", "child_id", "assessment_type"),
        Index("idx_predictions_signs_created", "has_autism_signs", "created_at"),
    )
