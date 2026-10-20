from pathlib import Path
from typing import Optional
from app.schemas.analysis import VideoAnalysisOut
from app.services.inference_service import InferenceService

class VideoService:
    @classmethod
    def analyze_video(
        cls,
        video_path: Path,
        child_name: str = "Selected Child",
        prediction_id: Optional[str] = None,
        file_id: Optional[str] = None
    ) -> VideoAnalysisOut:
        return InferenceService.analyze_video(
            video_path=video_path,
            child_name=child_name,
            prediction_id=prediction_id,
            file_id=file_id
        )
