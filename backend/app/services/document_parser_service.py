import re
import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import pypdf
import docx
from PIL import Image
from app.utils.logger import ml_logger

class DocumentParserService:
    """
    Parser service for hospital discharge summaries, clinical referral letters,
    pediatric evaluation records, and developmental screening documents.
    Extracts text from PDF, DOCX, and Image files and extracts child metadata.
    """

    @classmethod
    def extract_text(cls, file_path: Path) -> str:
        """Extract all raw text from a document based on its extension."""
        ext = file_path.suffix.lower()
        text = ""

        if ext == ".txt":
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            except Exception as e:
                ml_logger.warning(f"txt extraction error on {file_path.name}: {e}")

        elif ext == ".pdf":
            try:
                reader = pypdf.PdfReader(str(file_path))
                pages_text = []
                for idx, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        pages_text.append(page_text)
                text = "\n".join(pages_text)
            except Exception as e:
                ml_logger.warning(f"pypdf extraction error on {file_path.name}: {e}")

        elif ext in [".docx", ".doc"]:
            try:
                doc = docx.Document(str(file_path))
                paras = [p.text for p in doc.paragraphs if p.text]
                for table in doc.tables:
                    for row in table.rows:
                        row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                        if row_text:
                            paras.append(row_text)
                text = "\n".join(paras)
            except Exception as e:
                ml_logger.warning(f"docx extraction error on {file_path.name}: {e}")

        elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]:
            try:
                # Use easyocr for image text extraction
                import easyocr
                reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                results = reader.readtext(str(file_path), detail=0)
                text = "\n".join(results)
            except Exception as e:
                ml_logger.warning(f"easyocr extraction error on {file_path.name}: {e}")

        return text.strip()

    @classmethod
    def parse_child_details(cls, raw_text: str) -> Dict[str, Any]:
        """
        Extract child profile fields from clinical document text:
        - Child Name
        - Date of Birth (YYYY-MM-DD)
        - Gender (male/female/other)
        - Caregiver / Parent Name
        - Relationship
        - Hospital / Clinic Name
        - Evaluation / Document Date
        - Clinical Notes / Summary
        """
        if not raw_text:
            return {
                "name": "",
                "date_of_birth": "",
                "gender": "female",
                "caregiver_name": "",
                "relationship": "parent",
                "hospital_name": "",
                "document_date": "",
                "notes": "",
                "confidence": 0.0,
                "fields_detected": []
            }

        extracted: Dict[str, Any] = {
            "name": "",
            "date_of_birth": "",
            "gender": "female",
            "caregiver_name": "",
            "relationship": "parent",
            "hospital_name": "",
            "document_date": "",
            "notes": "",
            "confidence": 0.0,
            "fields_detected": []
        }

        # 1. Child / Patient Name
        name_patterns = [
            r"(?:Child(?:'s)?\s*Name|Patient\s*Name|Name\s*of\s*Child|Child|Patient)\s*[:\-]\s*([A-Za-z\s\.\-]{2,40})",
            r"(?:Name)\s*[:\-]\s*([A-Za-z\s\.\-]{2,40})",
        ]
        for pattern in name_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                clean_name = match.group(1).split("\n")[0].split("|")[0].strip()
                # filter out non-names like "Male", "Female", "DOB"
                if len(clean_name) > 2 and clean_name.lower() not in ["male", "female", "unknown", "pediatric"]:
                    extracted["name"] = clean_name.title()
                    extracted["fields_detected"].append("name")
                    break

        # 2. Date of Birth (DOB)
        dob_patterns = [
            r"(?:D\.?O\.?B\.?|Date\s*of\s*Birth|Birth\s*Date|Born)\s*[:\-]\s*([0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})",
        ]
        for pattern in dob_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                raw_dob = match.group(1).strip()
                normalized_dob = cls._normalize_date(raw_dob)
                if normalized_dob:
                    extracted["date_of_birth"] = normalized_dob
                    extracted["fields_detected"].append("date_of_birth")
                    break

        # 3. Gender
        gender_match = re.search(r"(?:Gender|Sex)\s*[:\-]\s*(Male|Female|Boy|Girl|M|F)", raw_text, re.IGNORECASE)
        if gender_match:
            g_val = gender_match.group(1).lower()
            if g_val in ["male", "boy", "m"]:
                extracted["gender"] = "male"
            elif g_val in ["female", "girl", "f"]:
                extracted["gender"] = "female"
            extracted["fields_detected"].append("gender")
        else:
            # Fallback scan for standalone indicators
            if re.search(r"\b(?:Boy|Male)\b", raw_text, re.IGNORECASE) and not re.search(r"\b(?:Girl|Female)\b", raw_text, re.IGNORECASE):
                extracted["gender"] = "male"
            elif re.search(r"\b(?:Girl|Female)\b", raw_text, re.IGNORECASE) and not re.search(r"\b(?:Boy|Male)\b", raw_text, re.IGNORECASE):
                extracted["gender"] = "female"

        # 4. Caregiver / Parent Name
        caregiver_patterns = [
            r"(?:Mother(?:'s)?\s*Name|Father(?:'s)?\s*Name|Parent(?:'s)?\s*Name|Caregiver(?:'s)?\s*Name|Guardian(?:'s)?\s*Name|Parent\/Guardian)\s*[:\-]\s*([A-Za-z\s\.\-]{2,40})",
            r"(?:Mother|Father|Caregiver|Guardian)\s*[:\-]\s*([A-Za-z\s\.\-]{2,40})"
        ]
        for pattern in caregiver_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                c_name = match.group(1).split("\n")[0].split("|")[0].strip()
                if len(c_name) > 2 and c_name.lower() not in ["none", "na", "n/a", "father", "mother"]:
                    extracted["caregiver_name"] = c_name.title()
                    extracted["fields_detected"].append("caregiver_name")
                    break

        # Relationship
        if re.search(r"\bMother\b", raw_text, re.IGNORECASE):
            extracted["relationship"] = "mother"
        elif re.search(r"\bFather\b", raw_text, re.IGNORECASE):
            extracted["relationship"] = "father"
        elif re.search(r"\bGuardian\b", raw_text, re.IGNORECASE):
            extracted["relationship"] = "guardian"
        else:
            extracted["relationship"] = "parent"

        # 5. Hospital / Clinic Name
        hosp_patterns = [
            r"(?:Hospital|Clinic|Center|Facility|Medical\s*Center|Medicare)\s*[:\-]\s*([A-Za-z0-9\s,\.\-&]{3,60})",
            r"(?:^|\n)\s*([A-Za-z0-9\s,\.\-&]{3,60}?(?:Hospital|Clinic|Children\'?s\s*Hospital|Healthcare|Medical\s*Center|Medicare|Pediatric\s*Clinic))",
            r"([A-Za-z0-9\s,\.\-&]{3,50}(?:Hospital|Clinic|Children\'?s\s*Hospital|Healthcare|Medical\s*Center|Medicare|Pediatric\s*Clinic))",
        ]
        for pattern in hosp_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                h_name = match.group(1).split("\n")[0].split("|")[0].strip()
                # filter out pure dates or patient strings
                if len(h_name) > 3 and not re.match(r"^\d{4}[-/.]\d{2}[-/.]\d{2}$", h_name) and not h_name.lower().startswith("patient"):
                    extracted["hospital_name"] = h_name
                    extracted["fields_detected"].append("hospital_name")
                    break

        # 6. Document / Evaluation Date
        doc_date_patterns = [
            r"(?:Evaluation\s*Date|Exam\s*Date|Visit\s*Date|Assessment\s*Date|Date\s*of\s*Report|Report\s*Date)\s*[:\-]\s*([0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})",
            r"(?:Date)\s*[:\-]\s*([0-9]{1,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,4}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+[0-9]{4})"
        ]
        for pattern in doc_date_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                raw_d = match.group(1).strip()
                # Ensure it's not the DOB
                norm_d = cls._normalize_date(raw_d)
                if norm_d and norm_d != extracted.get("date_of_birth"):
                    extracted["document_date"] = norm_d
                    extracted["fields_detected"].append("document_date")
                    break

        # 7. Clinical Summary / Observations / Notes
        notes_patterns = [
            r"(?:Clinical\s*Impression|Clinical\s*Notes|Impression|Developmental\s*Observations|Summary|History|Remarks|Diagnosis\s*Notes)\s*[:\-]\s*([^\n\r]+(?:\n[^\n\r]+){0,5})",
            r"(?:Reason\s*for\s*Referral|Referral\s*Reason)\s*[:\-]\s*([^\n\r]+(?:\n[^\n\r]+){0,3})"
        ]
        for pattern in notes_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                notes_text = match.group(1).strip()
                extracted["notes"] = notes_text[:500].strip()
                extracted["fields_detected"].append("notes")
                break

        if not extracted["notes"] and extracted["hospital_name"]:
            extracted["notes"] = f"Document parsed from {extracted['hospital_name']}."

        # Compute detection confidence
        total_fields = 5.0
        detected_count = len(set(extracted["fields_detected"]))
        extracted["confidence"] = round(min(1.0, max(0.2, detected_count / total_fields)), 2)

        return extracted

    @staticmethod
    def _normalize_date(date_str: str) -> Optional[str]:
        """Convert various date strings to standard ISO YYYY-MM-DD format."""
        if not date_str:
            return None
        date_str = date_str.strip().replace(",", " ")
        date_str = re.sub(r"\s+", " ", date_str)

        date_formats = [
            "%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d",
            "%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y",
            "%m-%d-%Y", "%m/%d/%Y",
            "%B %d %Y", "%b %d %Y",
            "%d %B %Y", "%d %b %Y",
        ]

        for fmt in date_formats:
            try:
                parsed = datetime.datetime.strptime(date_str, fmt).date()
                if 1990 <= parsed.year <= (datetime.date.today().year + 1):
                    return parsed.isoformat()
            except ValueError:
                continue

        # Regex for YYYY-MM-DD
        m = re.search(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", date_str)
        if m:
            try:
                return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
            except Exception:
                pass

        # Regex for DD/MM/YYYY or MM/DD/YYYY
        m = re.search(r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})", date_str)
        if m:
            part1 = int(m.group(1))
            part2 = int(m.group(2))
            year = int(m.group(3))
            # Heuristic: if part1 > 12, part1 is day
            if part1 > 12:
                day, month = part1, part2
            else:
                day, month = part2, part1
            try:
                if 1 <= month <= 12 and 1 <= day <= 31:
                    return f"{year:04d}-{month:02d}-{day:02d}"
            except Exception:
                pass

        return None
