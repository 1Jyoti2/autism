import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import settings
from app.schemas.document import HospitalDocumentParseResponse, ExtractedChildDetails
from app.services.document_parser_service import DocumentParserService
from app.utils.logger import logger

router = APIRouter()

ALLOWED_DOC_EXTS = {".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".webp", ".txt"}
MAX_DOC_SIZE_BYTES = 25 * 1024 * 1024  # 25MB

@router.post("/parse-hospital-doc", response_model=HospitalDocumentParseResponse)
@router.post("/parse", response_model=HospitalDocumentParseResponse, include_in_schema=False)
async def parse_hospital_document(
    file: UploadFile = File(..., description="Hospital PDF, DOCX, or Image document")
):
    """
    Upload a hospital report, developmental screening assessment, or referral letter.
    Parses document text using PDF/Word/OCR parsers and extracts child details
    (name, date of birth, gender, caregiver, notes) for user review & auto-fill.
    """
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_DOC_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported document format '{ext}'. Supported formats: PDF, DOCX, PNG, JPG, JPEG, WEBP."
        )

    # Save document to temp directory
    target_dir = settings.UPLOAD_DIR / "documents"
    target_dir.mkdir(parents=True, exist_ok=True)
    temp_path = target_dir / f"{uuid.uuid4().hex}{ext}"

    total_bytes = 0
    try:
        with open(temp_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_DOC_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum size of 25MB."
                    )
                buffer.write(chunk)

        if total_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file uploaded."
            )

        # Extract text using DocumentParserService
        raw_text = DocumentParserService.extract_text(temp_path)
        logger.info(f"Extracted {len(raw_text)} characters from {file.filename}")

        # Parse entities
        parsed = DocumentParserService.parse_child_details(raw_text)

        preview = raw_text[:500] if raw_text else "No textual content could be parsed from document."

        return HospitalDocumentParseResponse(
            status="success",
            message="Document parsed successfully",
            filename=file.filename or "document",
            file_type=ext.replace(".", "").upper(),
            raw_text_preview=preview,
            extracted=ExtractedChildDetails(**parsed)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing hospital document: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse document: {str(e)}"
        )
    finally:
        # Clean up temporary upload file if desired
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass
