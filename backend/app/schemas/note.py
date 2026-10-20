from typing import Optional
from pydantic import BaseModel

class NoteCreate(BaseModel):
    author: Optional[str] = "Care Provider"
    role: Optional[str] = "Doctor"
    title: str
    content: str
    date: Optional[str] = None
    child_id: Optional[str] = None

class NoteOut(BaseModel):
    id: str
    author: str
    role: str
    title: str
    content: str
    date: str
    child_id: Optional[str] = None

    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    time: str
    unread: bool = True

    class Config:
        from_attributes = True
