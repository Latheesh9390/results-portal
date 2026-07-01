"""Supplementary result router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth import get_current_admin
from database import get_db
from services import supplementary_result_service, student_service

router = APIRouter(dependencies=[Depends(get_current_admin)])


class SuppEntryIn(BaseModel):
    regular_entry_id: int
    internal_marks: int | None = None
    external_marks: int | None = None


class SuppResultIn(BaseModel):
    hallticket: str
    academic_year: str
    regulation: str
    semester: str
    regular_result_id: int
    entries: list[SuppEntryIn]


@router.get("/supplementary-results/failed-subjects")
def get_failed_subjects(hallticket: str, semester: str, db: Session = Depends(get_db)):
    """
    Returns the failed subjects for a student+semester, to pre-populate the
    supplementary entry form. Admin just enters hallticket → sees only failed subjects.
    """
    result = supplementary_result_service.get_failed_subjects_for_supply(db, hallticket, semester)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No regular result found for this hall ticket and semester."
        )

    rr = result["regular_result"]
    failed = result["failed_entries"]

    if not failed:
        raise HTTPException(
            status_code=200,
            detail="No failed subjects found. Student has already passed all subjects."
        )

    return {
        "regular_result_id": rr.id,
        "hallticket": rr.hallticket,
        "academic_year": rr.academic_year,
        "semester": rr.semester,
        "regulation": rr.regulation,
        "failed_subjects": [
            {
                "id": e.id,
                "subject_code": e.subject_code,
                "subject_name": e.subject_name,
                "credits": e.credits,
                "subject_type": e.subject_type,
                "internal_marks": e.internal_marks,  # original internal (reusable)
            }
            for e in failed
        ],
    }


@router.post("/supplementary-results", status_code=201)
def save_supplementary_result(payload: SuppResultIn, db: Session = Depends(get_db)):
    student = student_service.get_student_by_hallticket(db, payload.hallticket)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    sr = supplementary_result_service.save_supplementary_result(
        db=db,
        hallticket=payload.hallticket,
        academic_year=payload.academic_year,
        regulation=payload.regulation,
        semester=payload.semester,
        regular_result_id=payload.regular_result_id,
        entries_data=[e.model_dump() for e in payload.entries],
    )

    entries = supplementary_result_service.get_supp_entries(db, sr.id)
    return {
        "id": sr.id,
        "hallticket": sr.hallticket,
        "academic_year": sr.academic_year,
        "semester": sr.semester,
        "overall_result": sr.overall_result,
        "sgpa": sr.sgpa,
        "total_credits": sr.total_credits,
        "entries": [
            {
                "subject_code": e.subject_code,
                "subject_name": e.subject_name,
                "internal_marks": e.internal_marks,
                "external_marks": e.external_marks,
                "total_marks": e.total_marks,
                "grade": e.grade,
                "credits_earned": e.credits_earned,
                "result_status": e.result_status,
            }
            for e in entries
        ],
    }
