from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class ScreeningComputeRequest(BaseModel):
    answers: Dict[str, int] = Field(default_factory=dict)
    questions: Optional[List[Dict[str, Any]]] = None

class ScreeningComputeResponse(BaseModel):
    domainScores: Dict[str, int]
    totalScore: int
    maxScore: int
    probability: int
    likelihood: str
    recommendations: List[str]

class ScreeningCreate(BaseModel):
    id: Optional[str] = None
    child_id: Optional[str] = Field(None, alias="childId")
    date: Optional[str] = None
    status: Optional[str] = "completed"
    assessment_type: Optional[str] = Field("M-CHAT-R Screening", alias="assessmentType")
    answers: Dict[str, int] = Field(default_factory=dict)
    domain_scores: Optional[Dict[str, int]] = Field(default_factory=dict, alias="domainScores")
    total_score: Optional[int] = Field(0, alias="totalScore")
    max_score: Optional[int] = Field(30, alias="maxScore")
    probability: Optional[int] = 0
    likelihood: Optional[str] = "low"
    recommendations: Optional[List[str]] = Field(default_factory=list)

    class Config:
        populate_by_name = True

class ScreeningOut(BaseModel):
    id: str
    childId: str
    date: str
    status: str
    assessmentType: str = "M-CHAT-R Screening"
    answers: Dict[str, int]
    domainScores: Dict[str, int]
    totalScore: int
    maxScore: int
    probability: int
    likelihood: str
    recommendations: List[str]

    class Config:
        from_attributes = True
        populate_by_name = True
