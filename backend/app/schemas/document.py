from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ExtractedChildDetails(BaseModel):
    name: str = ""
    date_of_birth: Optional[str] = Field(None, alias="dateOfBirth")
    gender: str = "female"
    caregiver_name: Optional[str] = Field(None, alias="caregiverName")
    relationship: Optional[str] = "parent"
    hospital_name: Optional[str] = Field(None, alias="hospitalName")
    document_date: Optional[str] = Field(None, alias="documentDate")
    notes: Optional[str] = None
    confidence: float = 0.0
    fields_detected: List[str] = Field(default_factory=list, alias="fieldsDetected")

    class Config:
        populate_by_name = True

class HospitalDocumentParseResponse(BaseModel):
    status: str = "success"
    message: str = "Document parsed successfully"
    filename: str
    file_type: str
    raw_text_preview: str
    extracted: ExtractedChildDetails

    class Config:
        populate_by_name = True
