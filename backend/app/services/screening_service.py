import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.screening import ScreeningRecord
from app.schemas.screening import (
    ScreeningCreate,
    ScreeningOut,
    ScreeningComputeRequest,
    ScreeningComputeResponse,
)

RISK_THRESHOLDS = {
    "elevated": 0.35,
    "high": 0.65,
}

DOMAIN_RECOMMENDATIONS = {
    "communication": "A speech and language evaluation can help support communication development.",
    "socialInteraction": "Structured play groups or social-skills support could help with social engagement.",
    "repetitiveBehavior": "Occupational or behavioral support may help with repetitive routines and flexibility.",
    "sensory": "An occupational therapy assessment can help with sensory sensitivities and everyday comfort.",
}

GENERAL_RECOMMENDATIONS = {
    "low": [
        "Continue monitoring typical developmental milestones.",
        "Re-screen in a few months to track any changes.",
    ],
    "elevated": [
        "Discuss your observations with your pediatrician.",
        "Track specific behaviors over the next few weeks.",
    ],
    "high": [
        "Seek a formal developmental evaluation from a qualified professional.",
        "Reach out to an early intervention program for timely support.",
    ],
}

DEFAULT_QUESTIONS = [
    {"id": "q_si_01", "domain": "socialInteraction"},
    {"id": "q_si_02", "domain": "socialInteraction"},
    {"id": "q_si_03", "domain": "socialInteraction"},
    {"id": "q_co_01", "domain": "communication"},
    {"id": "q_co_02", "domain": "communication"},
    {"id": "q_co_03", "domain": "communication"},
    {"id": "q_rb_01", "domain": "repetitiveBehavior"},
    {"id": "q_rb_02", "domain": "repetitiveBehavior"},
    {"id": "q_se_01", "domain": "sensory"},
    {"id": "q_se_02", "domain": "sensory"},
]

DEFAULT_SCREENINGS_SEED = [
    {
        "id": "scr_1001",
        "child_id": "ch_liam",
        "date": "2026-06-09T09:30:00.000Z",
        "status": "completed",
        "assessment_type": "M-CHAT-R Screening",
        "total_score": 42,
        "max_score": 60,
        "probability": 70,
        "likelihood": "high",
        "domain_scores": {"communication": 12, "socialInteraction": 11, "repetitiveBehavior": 12, "sensory": 7},
        "answers": {"q1": 2, "q2": 3, "q3": 2, "q4": 3, "q5": 2, "q6": 2, "q7": 3, "q8": 2, "q9": 3, "q10": 1, "q11": 2, "q12": 1},
        "recommendations": [
            "Seek a formal developmental evaluation from a qualified professional.",
            "Reach out to an early intervention program for timely support.",
            "A speech and language evaluation can help support communication development."
        ]
    },
    {
        "id": "scr_1002",
        "child_id": "ch_maya",
        "date": "2026-04-24T14:05:00.000Z",
        "status": "completed",
        "assessment_type": "M-CHAT-R Screening",
        "total_score": 14,
        "max_score": 60,
        "probability": 23,
        "likelihood": "low",
        "domain_scores": {"communication": 4, "socialInteraction": 3, "repetitiveBehavior": 4, "sensory": 3},
        "answers": {"q1": 1, "q2": 1, "q3": 0, "q4": 1, "q5": 0, "q6": 1, "q7": 1, "q8": 1, "q9": 0, "q10": 1, "q11": 0, "q12": 1},
        "recommendations": [
            "Continue monitoring typical developmental milestones.",
            "Re-screen in a few months to track any changes."
        ]
    },
    {
        "id": "scr_1003",
        "child_id": "ch_liam",
        "date": "2026-03-02T11:20:00.000Z",
        "status": "completed",
        "assessment_type": "M-CHAT-R Screening",
        "total_score": 38,
        "max_score": 60,
        "probability": 63,
        "likelihood": "elevated",
        "domain_scores": {"communication": 11, "socialInteraction": 10, "repetitiveBehavior": 11, "sensory": 6},
        "answers": {"q1": 2, "q2": 2, "q3": 2, "q4": 2, "q5": 2, "q6": 2, "q7": 2, "q8": 3, "q9": 2, "q10": 1, "q11": 2, "q12": 1},
        "recommendations": [
            "Discuss your observations with your pediatrician.",
            "Track specific behaviors over the next few weeks.",
            "Occupational or behavioral support may help with repetitive routines and flexibility."
        ]
    },
    {
        "id": "scr_1004",
        "child_id": "ch_sofia",
        "date": "2026-05-30T10:45:00.000Z",
        "status": "completed",
        "assessment_type": "M-CHAT-R Screening",
        "total_score": 12,
        "max_score": 60,
        "probability": 20,
        "likelihood": "low",
        "domain_scores": {"communication": 3, "socialInteraction": 2, "repetitiveBehavior": 2, "sensory": 5},
        "answers": {"q1": 1, "q2": 0, "q3": 1, "q4": 0, "q5": 1, "q6": 0, "q7": 0, "q8": 1, "q9": 0, "q10": 2, "q11": 1, "q12": 1},
        "recommendations": [
            "Continue monitoring typical developmental milestones.",
            "Re-screen in a few months to track any changes."
        ]
    }
]

class ScreeningService:
    @staticmethod
    def compute_score(req: ScreeningComputeRequest) -> ScreeningComputeResponse:
        answers = req.answers
        questions = req.questions or DEFAULT_QUESTIONS
        domains = list(dict.fromkeys(q.get("domain", "general") for q in questions))
        max_score = len(questions) * 3

        domain_scores: Dict[str, int] = {}
        total_score = 0

        for domain in domains:
            d_sum = 0
            for q in questions:
                if q.get("domain") == domain:
                    d_sum += answers.get(q.get("id"), 0)
            domain_scores[domain] = d_sum
            total_score += d_sum

        ratio = total_score / max_score if max_score > 0 else 0
        if ratio < RISK_THRESHOLDS["elevated"]:
            likelihood = "low"
        elif ratio < RISK_THRESHOLDS["high"]:
            likelihood = "elevated"
        else:
            likelihood = "high"

        probability = min(99, max(1, round(ratio * 100)))

        # Recommendations
        general = GENERAL_RECOMMENDATIONS.get(likelihood, GENERAL_RECOMMENDATIONS["low"])
        sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1], reverse=True)
        top_domain = sorted_domains[0][0] if sorted_domains else None

        recs = list(general)
        if top_domain and likelihood != "low" and DOMAIN_RECOMMENDATIONS.get(top_domain):
            domain_rec = DOMAIN_RECOMMENDATIONS[top_domain]
            if domain_rec not in recs:
                recs.append(domain_rec)

        return ScreeningComputeResponse(
            domainScores=domain_scores,
            totalScore=total_score,
            maxScore=max_score,
            probability=probability,
            likelihood=likelihood,
            recommendations=recs
        )

    @classmethod
    def seed_initial_if_empty(cls, db: Session):
        if db.query(ScreeningRecord).count() == 0:
            for item in DEFAULT_SCREENINGS_SEED:
                rec = ScreeningRecord(**item)
                db.add(rec)
            db.commit()

    @classmethod
    def get_all(cls, db: Session, child_id: Optional[str] = None) -> List[ScreeningOut]:
        cls.seed_initial_if_empty(db)
        query = db.query(ScreeningRecord)
        if child_id:
            query = query.filter(ScreeningRecord.child_id == child_id)
        records = query.order_by(ScreeningRecord.date.desc()).all()
        return [
            ScreeningOut(
                id=r.id,
                childId=r.child_id,
                date=r.date,
                status=r.status,
                assessmentType=r.assessment_type or "M-CHAT-R Screening",
                answers=r.answers or {},
                domainScores=r.domain_scores or {},
                totalScore=r.total_score,
                maxScore=r.max_score,
                probability=r.probability,
                likelihood=r.likelihood,
                recommendations=r.recommendations or []
            )
            for r in records
        ]

    @classmethod
    def create_screening(cls, db: Session, data: ScreeningCreate) -> ScreeningOut:
        scr_id = data.id or f"scr_{uuid.uuid4().hex[:8]}"
        date_str = data.date or datetime.utcnow().isoformat()
        
        # If score not precomputed, compute
        if not data.domain_scores or data.total_score == 0:
            computed = cls.compute_score(ScreeningComputeRequest(answers=data.answers))
            domain_scores = computed.domainScores
            total_score = computed.totalScore
            max_score = computed.maxScore
            probability = computed.probability
            likelihood = computed.likelihood
            recommendations = computed.recommendations
        else:
            domain_scores = data.domain_scores
            total_score = data.total_score
            max_score = data.max_score
            probability = data.probability
            likelihood = data.likelihood
            recommendations = data.recommendations

        new_record = ScreeningRecord(
            id=scr_id,
            child_id=data.child_id or "ch_maya",
            date=date_str,
            status=data.status or "completed",
            assessment_type=data.assessment_type or "M-CHAT-R Screening",
            total_score=total_score,
            max_score=max_score,
            probability=probability,
            likelihood=likelihood,
            domain_scores=domain_scores,
            answers=data.answers,
            recommendations=recommendations,
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return ScreeningOut(
            id=new_record.id,
            childId=new_record.child_id,
            date=new_record.date,
            status=new_record.status,
            assessmentType=new_record.assessment_type,
            answers=new_record.answers or {},
            domainScores=new_record.domain_scores or {},
            totalScore=new_record.total_score,
            maxScore=new_record.max_score,
            probability=new_record.probability,
            likelihood=new_record.likelihood,
            recommendations=new_record.recommendations or []
        )

    @classmethod
    def delete_screening(cls, db: Session, screening_id: str) -> bool:
        rec = db.query(ScreeningRecord).filter(ScreeningRecord.id == screening_id).first()
        if not rec:
            return False
        db.delete(rec)
        db.commit()
        return True
