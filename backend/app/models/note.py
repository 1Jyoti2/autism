from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True, index=True)
    author = Column(String, nullable=False)
    role = Column(String, default="Doctor")
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    date = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    child_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
