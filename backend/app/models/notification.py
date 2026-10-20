from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    time = Column(String, nullable=False)
    unread = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
