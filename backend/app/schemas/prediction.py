from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class UploadedFileOut(BaseModel):
    id: str
    fileName: str = Field(..., alias="file_name")
    filePath: str = Field(..., alias="file_path")
    fileType: str = Field(..., alias="file_type")
    fileSizeBytes: int = Field(0, alias="file_size_bytes")
    mimeType: Optional[str] = Field(None, alias="mime_type")
    createdAt: str

    class Config:
        from_attributes = True
        populate_by_name = True

class PredictionHistoryOut(BaseModel):
    id: str
    predictionId: str = Field(..., alias="prediction_id")
    action: str
    reviewerNotes: Optional[str] = Field(None, alias="reviewer_notes")
    clinicalFeedback: Optional[str] = Field(None, alias="clinical_feedback")
    snapshotData: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="snapshot_data")
    createdAt: str

    class Config:
        from_attributes = True
        populate_by_name = True

class PredictionRecordOut(BaseModel):
    id: str
    type: str  # "image" or "video"
    assessmentType: str = Field(..., alias="assessment_type")
    modelName: str = Field(..., alias="model_name")
    predictedClass: str = Field(..., alias="predicted_class")
    predictedEmotion: Optional[str] = None
    predictedBehavior: Optional[str] = None
    predictedBehaviorKey: Optional[str] = Field(None, alias="predicted_behavior_key")
    confidenceScore: float = Field(..., alias="confidence_score")
    confidencePercentage: str
    hasAutismSigns: bool = Field(False, alias="has_autism_signs")
    status: str
    statusTone: str = Field("neutral", alias="status_tone")
    explanation: Optional[str] = None
    recommendation: Optional[str] = None
    rawProbabilities: Optional[List[Dict[str, Any]]] = Field(default_factory=list, alias="raw_probabilities")
    metadataJson: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="metadata_json")
    
    # Association fields
    child_id: Optional[str] = Field(None, alias="childId")
    childId: Optional[str] = None
    childName: Optional[str] = None
    file_id: Optional[str] = Field(None, alias="fileId")
    fileId: Optional[str] = None
    fileUrl: Optional[str] = None
    
    date: str
    createdAt: str

    class Config:
        from_attributes = True
        populate_by_name = True

class PredictionDetailOut(PredictionRecordOut):
    fileDetails: Optional[UploadedFileOut] = None
    history: List[PredictionHistoryOut] = Field(default_factory=list)

class PaginatedPredictionsOut(BaseModel):
    items: List[PredictionRecordOut]
    total: int
    page: int
    pageSize: int = 10
    page_size: int = 10
    totalPages: int = 1
    total_pages: int = 1
    hasMore: bool = False
    has_more: bool = False

    class Config:
        populate_by_name = True


class PredictionReviewCreate(BaseModel):
    reviewerNotes: Optional[str] = None
    clinicalFeedback: Optional[str] = None
    statusChange: Optional[str] = None
