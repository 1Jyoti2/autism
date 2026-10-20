from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ClassProbability(BaseModel):
    class_key: str = Field(..., alias="classKey")
    label: str
    confidence: float
    percentage: str

    class Config:
        populate_by_name = True

class ImageAnalysisOut(BaseModel):
    # Primary Emotion Classification fields
    predicted_emotion: str = Field(..., alias="predictedEmotion")
    confidence_score: float = Field(..., alias="confidenceScore")
    confidence: float
    confidencePercentage: str
    probabilities: List[Dict[str, Any]] = Field(default_factory=list)

    # Screening & Clinical interpretation fields
    status: str
    statusTone: str
    hasSigns: bool
    childName: str
    child_id: Optional[str] = Field(None, alias="childId")
    childId: Optional[str] = None
    detectedClass: str
    assessmentType: str = "Image Analysis"
    subtitle: str
    recommendation: str
    explanation: str
    analyzedAt: str

    # Database identifiers (supporting both snake_case and camelCase)
    prediction_id: Optional[str] = Field(None, alias="predictionId")
    predictionId: Optional[str] = None
    file_id: Optional[str] = Field(None, alias="fileId")
    fileId: Optional[str] = None
    disclaimer: Optional[str] = None

    class Config:
        populate_by_name = True

class VideoAnalysisOut(BaseModel):
    # Primary Stimming Behavior Classification fields
    predicted_behavior: str = Field(..., alias="predictedBehavior")
    confidence_score: float = Field(..., alias="confidenceScore")
    confidence: float
    confidencePercentage: str
    probabilities: List[Dict[str, Any]] = Field(default_factory=list)

    # Screening & Clinical interpretation fields
    detectedBehavior: str
    detectedClass: str
    behaviorKey: str
    status: str
    statusTone: str
    hasSigns: bool
    childName: str
    child_id: Optional[str] = Field(None, alias="childId")
    childId: Optional[str] = None
    assessmentType: str = "Video Analysis"
    subtitle: str
    recommendation: str
    explanation: str
    analyzedAt: str

    # Video Metadata & Database identifiers
    video_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="videoMetadata")
    prediction_id: Optional[str] = Field(None, alias="predictionId")
    predictionId: Optional[str] = None
    file_id: Optional[str] = Field(None, alias="fileId")
    fileId: Optional[str] = None
    disclaimer: Optional[str] = None

    class Config:
        populate_by_name = True
