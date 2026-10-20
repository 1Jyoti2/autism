from pathlib import Path
from typing import Optional
from app.schemas.analysis import ImageAnalysisOut
from app.services.inference_service import InferenceService

class EmotionService:
    @classmethod
    def analyze_image(
        cls,
        image_path: Path,
        child_name: str = "Selected Child",
        prediction_id: Optional[str] = None,
        file_id: Optional[str] = None
    ) -> ImageAnalysisOut:
        return InferenceService.analyze_image(
            image_path=image_path,
            child_name=child_name,
            prediction_id=prediction_id,
            file_id=file_id
        )
