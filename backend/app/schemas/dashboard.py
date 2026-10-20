from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.prediction import PredictionRecordOut
from app.schemas.child import ChildOut

class EmotionFrequencyItem(BaseModel):
    emotion: str
    label: str
    count: int
    percentage: float

class BehaviorFrequencyItem(BaseModel):
    behavior: str
    label: str
    count: int
    percentage: float

class ActivityByDateItem(BaseModel):
    date: str
    total: int = 0
    imageCount: int = 0
    image_count: int = 0
    videoCount: int = 0
    video_count: int = 0

    class Config:
        populate_by_name = True

class DashboardMetricsOut(BaseModel):
    totalPredictions: int = 0
    total_predictions: int = 0
    imagePredictionCount: int = 0
    image_prediction_count: int = 0
    videoPredictionCount: int = 0
    video_prediction_count: int = 0
    recentPredictions: List[PredictionRecordOut] = Field(default_factory=list)
    recent_predictions: List[PredictionRecordOut] = Field(default_factory=list)
    mostFrequentEmotions: List[EmotionFrequencyItem] = Field(default_factory=list)
    most_frequent_emotions: List[EmotionFrequencyItem] = Field(default_factory=list)
    mostFrequentBehaviors: List[BehaviorFrequencyItem] = Field(default_factory=list)
    most_frequent_behaviors: List[BehaviorFrequencyItem] = Field(default_factory=list)
    predictionActivityByDate: List[ActivityByDateItem] = Field(default_factory=list)
    prediction_activity_by_date: List[ActivityByDateItem] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class RoleDashboardOut(BaseModel):
    role: str
    metrics: Optional[DashboardMetricsOut] = None
    data: Dict[str, Any] = Field(default_factory=dict)

class ParentDashboardOut(BaseModel):
    children: List[ChildOut] = Field(default_factory=list)
    totalChildren: int = 0
    completedScreenings: int = 0
    pendingAssessments: int = 0
    activeAlerts: int = 0
    recentScreenings: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Optional[DashboardMetricsOut] = None

    class Config:
        populate_by_name = True

class DoctorDashboardOut(BaseModel):
    assignedPatients: List[ChildOut] = Field(default_factory=list)
    totalPatients: int = 0
    pendingReviews: int = 0
    highRiskFlags: int = 0
    completedEvaluations: int = 0
    recentActivity: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Optional[DashboardMetricsOut] = None

    class Config:
        populate_by_name = True

class CaretakerDashboardOut(BaseModel):
    assignedChildren: List[ChildOut] = Field(default_factory=list)
    totalAssigned: int = 0
    dailyTasks: List[Dict[str, Any]] = Field(default_factory=list)
    recentObservations: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Optional[DashboardMetricsOut] = None

    class Config:
        populate_by_name = True

class AdminDashboardOut(BaseModel):
    totalUsers: int = 0
    activeParents: int = 0
    activeDoctors: int = 0
    activeCaretakers: int = 0
    systemHealth: str = "100% Operational"
    children: List[ChildOut] = Field(default_factory=list)
    metrics: Optional[DashboardMetricsOut] = None

    class Config:
        populate_by_name = True
