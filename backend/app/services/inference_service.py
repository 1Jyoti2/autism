from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from app.ml.emotion_model import get_emotion_model, EmotionModelWrapper
from app.ml.video_model import get_video_model, VideoModelWrapper
from app.schemas.analysis import ImageAnalysisOut, VideoAnalysisOut
from app.utils.logger import ml_logger
from app.utils.exceptions import (
    CorruptedMediaException,
    InferenceExecutionException,
    ModelNotFoundException,
)

BEHAVIOR_DESCRIPTIONS = {
    "arm_flapping": "Repetitive rapid movement of arms or hands up and down or side to side.",
    "head_banging": "Repetitive movement of the head against surfaces or back and forth.",
    "spinning": "Continuous repetitive body spinning or turning in circles."
}

class InferenceService:
    """
    Dedicated ML Inference Service Layer.
    Coordinates model loading, memory lifecycle, tensor preprocessing, inference execution,
    result interpretation, and domain error management.
    """

    @classmethod
    def preload_all_models(cls):
        """Preload both ML models into GPU/CPU memory during application startup."""
        ml_logger.info("Pre-warming ML models into memory...")
        emotion_wrapper = get_emotion_model()
        video_wrapper = get_video_model()
        ml_logger.info(
            f"ML Models Pre-warmed. EmotionModel: loaded={emotion_wrapper.loaded}, "
            f"VideoModel: loaded={video_wrapper.loaded}"
        )

    @classmethod
    def get_models_health(cls) -> Dict[str, Any]:
        """Check the status of loaded ML models."""
        em = get_emotion_model()
        vm = get_video_model()
        return {
            "emotion_model": {
                "loaded": em.loaded,
                "device": str(em.device),
                "load_duration_ms": em.load_duration_ms,
                "architecture": "ResNet18",
            },
            "video_model": {
                "loaded": vm.loaded,
                "device": str(vm.device),
                "load_duration_ms": vm.load_duration_ms,
                "architecture": "Temporal MobileNetV3",
                "classes": vm.classes,
            }
        }

    @classmethod
    def analyze_image(
        cls,
        image_path: Path,
        child_name: str = "Selected Child",
        prediction_id: Optional[str] = None,
        file_id: Optional[str] = None
    ) -> ImageAnalysisOut:
        """
        Execute Facial Emotion Recognition inference and map to clinical screening signals.
        """
        if not image_path.exists():
            raise CorruptedMediaException(media_type="image", reason="Saved image file not found on disk")

        model = get_emotion_model()
        pred = model.predict(image_path)

        top_class = pred.get("top_class", "Natural")
        top_class_key = str(pred.get("top_class_key", top_class)).lower()
        confidence = float(pred.get("top_confidence", 0.85))
        confidence_percent = f"{round(confidence * 100)}%"

        # In developmental psychology and early childhood screening (M-CHAT/ADOS-2 affective cues):
        # - Natural (Neutral), Joy (Smiling/Engagement), and Surprise (Attentive Curiosity) represent typical social affect.
        # - Sadness, Fear, or Anger may reflect acute distress, flat affect, or atypical regulation, serving as preliminary indicators for observation.
        # - A single facial photo NEVER constitutes a diagnosis of Autism Spectrum Disorder.
        is_typical = top_class_key in ["natural", "joy", "surprise"]

        if is_typical:
            status = "Typical Social-Emotional Indicators Observed"
            status_tone = "success"
            has_signs = False
            detected_class = f"Typical Social Affect ({top_class})"
            subtitle = "Preliminary screening observed typical social-emotional facial engagement within standard developmental bounds."
            recommendation = "Continue positive, shared socio-emotional interactions and maintain routine pediatric wellness checkups."
            explanation = (
                f"The facial image screening identified a {top_class.lower()} expression, displaying typical affective "
                f"responsiveness and social engagement cues without signs of persistent affective flattening or withdrawal."
            )
        else:
            status = "Preliminary Atypical Affective Indicators - Follow-up Advised"
            status_tone = "warning"
            has_signs = True
            detected_class = f"Atypical Facial Affect ({top_class})"
            subtitle = "Preliminary screening noted non-typical affective cues or distress signals that warrant gentle developmental observation."
            recommendation = (
                "Gentle observation over multiple settings is advised. If atypical affect, communication differences, "
                "or social withdrawal persist, consult a qualified pediatrician or developmental specialist."
            )
            explanation = (
                f"The screening model observed a {top_class.lower()} facial affect pattern. Note that isolated static photos "
                f"can be strongly influenced by temporary fatigue, environment, or fleeting mood and do not represent a diagnosis."
            )

        return ImageAnalysisOut(
            predictedEmotion=top_class,
            confidenceScore=round(confidence, 4),
            confidence=round(confidence, 4),
            confidencePercentage=confidence_percent,
            probabilities=pred.get("probabilities", []),
            status=status,
            statusTone=status_tone,
            hasSigns=has_signs,
            childName=child_name,
            detectedClass=detected_class,
            assessmentType="Image Analysis",
            subtitle=subtitle,
            recommendation=recommendation,
            explanation=explanation,
            analyzedAt=datetime.utcnow().isoformat(),
            predictionId=prediction_id,
            fileId=file_id,
            disclaimer="Preliminary Screening Notice: This AI assessment evaluates facial affective engagement as an early screening aid. It is NOT a clinical diagnosis. Comprehensive evaluation requires a qualified healthcare professional."
        )

    @classmethod
    def analyze_video(
        cls,
        video_path: Path,
        child_name: str = "Selected Child",
        prediction_id: Optional[str] = None,
        file_id: Optional[str] = None
    ) -> VideoAnalysisOut:
        """
        Execute Video Stimming Behavior action recognition and map to motor cues.
        """
        if not video_path.exists():
            raise CorruptedMediaException(media_type="video", reason="Saved video file not found on disk")

        model = get_video_model()
        pred = model.predict(video_path)

        predicted_behavior = pred.get("predicted_behavior", "Arm Flapping")
        predicted_key = pred.get("predicted_behavior_key", "arm_flapping")
        confidence = pred.get("confidence", 0.85)
        confidence_percent = pred.get("confidence_percentage", f"{round(confidence * 100)}%")
        desc = BEHAVIOR_DESCRIPTIONS.get(predicted_key, "Repetitive motor coordination cue.")

        has_signs = confidence > 0.40

        if has_signs:
            status = "Autism-Related Behavioral Signs Detected"
            status_tone = "danger"
            subtitle = "Early screening indicates motor behavior patterns that may be associated with Autism Spectrum Disorder."
            recommendation = "Further evaluation by a qualified healthcare professional is recommended."
            explanation = f"The temporal video analysis model detected motor repetition patterns characteristic of {predicted_behavior} ({desc})."
            detected_behavior = predicted_behavior
            detected_class = predicted_behavior
        else:
            status = "No Significant Behavioral Signs Detected"
            status_tone = "success"
            subtitle = "The video classification model did not detect significant repetitive motor behavior patterns."
            recommendation = "Continue monitoring the child's developmental milestones and consult a healthcare professional if concerns arise."
            explanation = "The video analysis indicates continuous fluid motor activity without elevated repetitive motor patterns."
            detected_behavior = "No Repetitive Motor Cues"
            detected_class = "Typical Motor Movements"
            predicted_key = "typical"

        return VideoAnalysisOut(
            predictedBehavior=predicted_behavior,
            confidenceScore=round(confidence, 4),
            confidence=round(confidence, 4),
            confidencePercentage=confidence_percent,
            probabilities=pred.get("probabilities", []),
            status=status,
            statusTone=status_tone,
            hasSigns=has_signs,
            childName=child_name,
            detectedBehavior=detected_behavior,
            detectedClass=detected_class,
            behaviorKey=predicted_key,
            assessmentType="Video Analysis",
            subtitle=subtitle,
            recommendation=recommendation,
            explanation=explanation,
            analyzedAt=datetime.utcnow().isoformat(),
            videoMetadata=pred.get("video_metadata", {}),
            predictionId=prediction_id,
            fileId=file_id,
            disclaimer="NOTICE: This model is a lightweight ML prototype. It is intended for educational/technical demonstration only and DOES NOT provide medical diagnosis."
        )
