"""
Public student-facing result search.
Student enters hall ticket → sees full result with photo, SGPA, CGPA.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models.student import Student
from models.regular_result import RegularResult, RegularResultEntry
from models.supplementary_result import SupplementaryResult, SupplementaryResultEntry

router = APIRouter()


class SearchRequest(BaseModel):
    hallticket: str
    exam_type: str = "regular"
    semester: str | None = None


def _build_regular_memo(db, hallticket, semester):
    q = db.query(RegularResult).filter(
        RegularResult.hallticket == hallticket.upper().strip(),
        RegularResult.exam_type == "regular",
    )
    if semester:
        q = q.filter(RegularResult.semester == semester.strip())
    results = q.order_by(RegularResult.id.desc()).all()
    if not results:
        return None
    student = db.query(Student).filter(Student.hallticket == hallticket.upper().strip()).first()
    out = []
    for rr in results:
        entries = db.query(RegularResultEntry).filter(RegularResultEntry.result_id == rr.id).order_by(RegularResultEntry.id).all()
        out.append({
            "id": rr.id, "academic_year": rr.academic_year, "semester": rr.semester,
            "regulation": rr.regulation, "exam_type": rr.exam_type,
            "sgpa": rr.sgpa, "cgpa": rr.cgpa, "total_credits": rr.total_credits,
            "overall_result": rr.overall_result,
            "entries": [{"subject_code": e.subject_code, "subject_name": e.subject_name,
                "credits": e.credits, "subject_type": e.subject_type,
                "internal_marks": e.internal_marks, "external_marks": e.external_marks,
                "total_marks": e.total_marks, "grade": e.grade,
                "grade_point": e.grade_point, "credits_earned": e.credits_earned,
                "result_status": e.result_status} for e in entries],
        })
    return {
        "hallticket": hallticket.upper().strip(),
        "student_name": student.student_name if student else "",
        "branch": student.branch if student else "",
        "regulation": student.regulation if student else "",
        "batch": student.batch if student else "",
        "photo": student.photo if student else None,
        "results": out,
    }


def _build_supplementary_memo(db, hallticket, semester):
    q = db.query(SupplementaryResult).filter(SupplementaryResult.hallticket == hallticket.upper().strip())
    if semester:
        q = q.filter(SupplementaryResult.semester == semester.strip())
    srs = q.order_by(SupplementaryResult.id.desc()).all()
    if not srs:
        return None
    student = db.query(Student).filter(Student.hallticket == hallticket.upper().strip()).first()
    out = []
    for sr in srs:
        entries = db.query(SupplementaryResultEntry).filter(SupplementaryResultEntry.supp_result_id == sr.id).all()
        out.append({
            "id": sr.id, "academic_year": sr.academic_year, "semester": sr.semester,
            "regulation": sr.regulation, "exam_type": "supplementary",
            "sgpa": sr.sgpa, "total_credits": sr.total_credits, "overall_result": sr.overall_result,
            "entries": [{"subject_code": e.subject_code, "subject_name": e.subject_name,
                "credits": e.credits, "internal_marks": e.internal_marks,
                "external_marks": e.external_marks, "total_marks": e.total_marks,
                "grade": e.grade, "grade_point": e.grade_point,
                "credits_earned": e.credits_earned, "result_status": e.result_status} for e in entries],
        })
    return {
        "hallticket": hallticket.upper().strip(),
        "student_name": student.student_name if student else "",
        "branch": student.branch if student else "",
        "regulation": student.regulation if student else "",
        "batch": student.batch if student else "",
        "photo": student.photo if student else None,
        "results": out,
    }


@router.post("/results/search")
def search_result(payload: SearchRequest, db: Session = Depends(get_db)):
    if payload.exam_type == "supplementary":
        memo = _build_supplementary_memo(db, payload.hallticket, payload.semester)
    else:
        memo = _build_regular_memo(db, payload.hallticket, payload.semester)
    if memo is None:
        raise HTTPException(status_code=404, detail="No result found for this hall ticket.")
    return memo


@router.get("/results/{hallticket}")
def get_result_direct(hallticket: str, exam: str = "regular", semester: str = None, db: Session = Depends(get_db)):
    if exam == "supplementary":
        memo = _build_supplementary_memo(db, hallticket, semester)
    else:
        memo = _build_regular_memo(db, hallticket, semester)
    if memo is None:
        raise HTTPException(status_code=404, detail="No result found for this hall ticket.")
    return memo
