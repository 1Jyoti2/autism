import os
import uuid
import shutil
import cv2
from pathlib import Path
from PIL import Image
from fastapi import UploadFile, HTTPException, status
from app.config import settings
from app.utils.logger import ml_logger
from app.utils.exceptions import (
    UnsupportedMediaFormatException,
    EmptyMediaFileException,
    FileTooLargeException,
    CorruptedMediaException,
    MLInferenceException,
)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024   # 15 MB
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB

def validate_file_extension(filename: str, allowed_extensions: set) -> str:
    """Validate that the file has an acceptable extension."""
    ext = Path(filename).suffix.lower()
    if not ext or ext not in allowed_extensions:
        ml_logger.warning(f"File upload rejected: unsupported extension '{ext}' in '{filename}'")
        raise UnsupportedMediaFormatException(extension=ext or "none", allowed=allowed_extensions)
    return ext

def validate_image_file(upload_file: UploadFile) -> str:
    """Validate image extension."""
    return validate_file_extension(upload_file.filename or "image.jpg", ALLOWED_IMAGE_EXTENSIONS)

def validate_video_file(upload_file: UploadFile) -> str:
    """Validate video extension."""
    return validate_file_extension(upload_file.filename or "video.mp4", ALLOWED_VIDEO_EXTENSIONS)

def _validate_saved_image(file_path: Path):
    """Deep image integrity and corruption check."""
    try:
        # Step 1: Verify header integrity
        with Image.open(file_path) as img:
            img.verify()
        
        # Step 2: Test decoding by loading pixel data
        with Image.open(file_path) as img:
            img.load()
            if img.width < 8 or img.height < 8:
                raise ValueError("Image dimensions too small (must be at least 8x8 pixels)")
    except Exception as e:
        ml_logger.error(f"Image integrity validation failed for {file_path.name}: {e}")
        if file_path.exists():
            file_path.unlink()
        raise CorruptedMediaException(media_type="image", reason=str(e))

def _validate_saved_video(file_path: Path):
    """Deep video integrity and stream decoding check."""
    cap = cv2.VideoCapture(str(file_path))
    if not cap.isOpened():
        ml_logger.error(f"Video stream failed to open for {file_path.name}")
        if file_path.exists():
            file_path.unlink()
        raise CorruptedMediaException(media_type="video", reason="Could not open video stream or codec unsupported")

    try:
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            ml_logger.error(f"Failed to decode frames from video {file_path.name}")
            if file_path.exists():
                file_path.unlink()
            raise CorruptedMediaException(media_type="video", reason="Video stream contains 0 decodable frames")

        if frame.shape[0] < 10 or frame.shape[1] < 10:
            if file_path.exists():
                file_path.unlink()
            raise CorruptedMediaException(media_type="video", reason="Video resolution too low (< 10x10)")

    except CorruptedMediaException:
        raise
    except Exception as e:
        cap.release()
        ml_logger.error(f"Error during video frame verification for {file_path.name}: {e}")
        if file_path.exists():
            file_path.unlink()
        raise CorruptedMediaException(media_type="video", reason=str(e))

async def save_upload_file(
    upload_file: UploadFile,
    subfolder: str = "temp",
    max_bytes: int = MAX_IMAGE_SIZE_BYTES
) -> Path:
    """
    Safely stream and store an uploaded file to disk while validating size and media integrity.
    """
    target_dir = settings.UPLOAD_DIR / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)
    
    ext = Path(upload_file.filename or "file").suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = target_dir / unique_name

    total_bytes = 0
    chunk_size = 1024 * 1024  # 1 MB chunks

    try:
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await upload_file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    buffer.close()
                    if file_path.exists():
                        file_path.unlink()
                    max_mb = max_bytes // (1024 * 1024)
                    ml_logger.warning(f"File upload exceeded {max_mb} MB limit ({total_bytes} bytes)")
                    raise FileTooLargeException(max_mb=max_mb)
                buffer.write(chunk)

        if total_bytes == 0:
            if file_path.exists():
                file_path.unlink()
            ml_logger.warning("Empty file uploaded (0 bytes)")
            raise EmptyMediaFileException()

        # Perform deep media integrity validation
        if subfolder == "images" or ext in ALLOWED_IMAGE_EXTENSIONS:
            _validate_saved_image(file_path)
        elif subfolder == "videos" or ext in ALLOWED_VIDEO_EXTENSIONS:
            _validate_saved_video(file_path)

        ml_logger.info(f"Successfully validated and saved {subfolder} file: {file_path.name} ({total_bytes} bytes)")
        return file_path

    except (MLInferenceException, HTTPException):
        if file_path.exists():
            file_path.unlink()
        raise
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        ml_logger.error(f"Unexpected file saving failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and store uploaded file: {str(e)}"
        )
