from datetime import datetime
from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    child_id = Column(String, ForeignKey("children.id", ondelete="SET NULL"), nullable=True, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False, index=True)  # "image" or "video"
    file_size_bytes = Column(BigInteger, default=0)
    mime_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="uploaded_files")
    child = relationship("Child")
    predictions = relationship("Prediction", back_populates="file", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_uploaded_files_type_created", "file_type", "created_at"),
    )
