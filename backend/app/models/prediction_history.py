from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(String, primary_key=True, index=True)
    prediction_id = Column(String, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    child_id = Column(String, ForeignKey("children.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action = Column(String, nullable=False, default="created", index=True)  # created, reviewed, annotated, status_changed
    reviewer_notes = Column(Text, nullable=True)
    clinical_feedback = Column(Text, nullable=True)
    snapshot_data = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    prediction = relationship("Prediction", back_populates="history_entries")
    user = relationship("User", back_populates="prediction_histories")
    child = relationship("Child")

    __table_args__ = (
        Index("idx_history_pred_action", "prediction_id", "action"),
    )
