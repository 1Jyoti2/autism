from typing import Optional, Set
from fastapi import HTTPException, status

class BackendBaseException(HTTPException):
    """Base exception for all structured backend errors."""
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An unexpected error occurred.",
        error_code: Optional[str] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code or "SERVER_ERROR"

# =====================================================================
# Authentication & Authorization Exceptions
# =====================================================================

class InvalidCredentialsException(BackendBaseException):
    def __init__(self, detail: str = "Invalid email or password. Please try again."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="INVALID_CREDENTIALS"
        )

class DuplicateUserException(BackendBaseException):
    def __init__(self, email: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{email}' already exists. Please sign in.",
            error_code="DUPLICATE_EMAIL"
        )

class AuthenticationRequiredException(BackendBaseException):
    def __init__(self, detail: str = "Authentication required. Please sign in to continue."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTH_REQUIRED"
        )

class InvalidTokenException(BackendBaseException):
    def __init__(self, detail: str = "Session token is invalid or expired. Please sign in again."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="INVALID_TOKEN"
        )

class PermissionDeniedException(BackendBaseException):
    def __init__(self, detail: str = "You do not have permission to access or modify this resource."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="PERMISSION_DENIED"
        )

class ResourceNotFoundException(BackendBaseException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found.",
            error_code="NOT_FOUND"
        )

# =====================================================================
# File Upload & Media Validation Exceptions
# =====================================================================

class UnsupportedMediaFormatException(BackendBaseException):
    def __init__(self, extension: str, allowed: Set[str]):
        super().__init__(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{extension}'. Allowed file types: {', '.join(sorted(allowed))}",
            error_code="UNSUPPORTED_MEDIA_TYPE"
        )

class EmptyMediaFileException(BackendBaseException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes). Please upload a valid media file.",
            error_code="EMPTY_FILE"
        )

class FileTooLargeException(BackendBaseException):
    def __init__(self, max_mb: int):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Uploaded file exceeds the maximum allowed size limit of {max_mb} MB.",
            error_code="FILE_TOO_LARGE"
        )

class CorruptedMediaException(BackendBaseException):
    def __init__(self, media_type: str = "media", reason: str = "Unable to decode or read file stream."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted {media_type} file: {reason}",
            error_code="CORRUPTED_FILE"
        )

# =====================================================================
# Machine Learning & AI Exceptions
# =====================================================================

class MLInferenceException(BackendBaseException):
    def __init__(self, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, detail: str = "ML Inference Error"):
        super().__init__(status_code=status_code, detail=detail, error_code="ML_ERROR")

class ModelNotFoundException(MLInferenceException):
    def __init__(self, model_name: str = "Model"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"The required trained model weights for '{model_name}' could not be located on the server."
        )
        self.error_code = "MODEL_NOT_FOUND"

class InferenceExecutionException(MLInferenceException):
    def __init__(self, detail: str = "Error executing model forward pass."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model inference failed: {detail}"
        )
        self.error_code = "INFERENCE_FAILED"

# =====================================================================
# Database & System Exceptions
# =====================================================================

class DatabaseConnectionException(BackendBaseException):
    def __init__(self, detail: str = "Database service is temporarily unavailable. Please try again later."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            error_code="DATABASE_UNAVAILABLE"
        )

class InternalServerException(BackendBaseException):
    def __init__(self, detail: str = "An unexpected internal server error occurred. Please try again later."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="INTERNAL_SERVER_ERROR"
        )
