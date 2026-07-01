"""Regular result entry router — with auto-calculation of grades, SGPA, overall result."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth import get_current_admin
from database import get_db
from services import regular_result_service, subject_service, student_service

router = APIRouter(dependencies=[Depends(get_current_admin)])


class EntryIn(BaseModel):
    subject_id: int
    internal_marks: int | None = None
    external_marks: int | None = None


class RegularResultIn(BaseModel):
    hallticket: str
    academic_year: str
    regulation: str
    semester: str
    exam_type: str = "regular"
    entries: list[EntryIn]
    cgpa: str | None = None


class EntryOut(BaseModel):
    id: int
    subject_id: int | None
    subject_code: str
    subject_name: str
    credits: float
    subject_type: str | None
    internal_marks: int | None
    external_marks: int | None
    total_marks: int | None
    grade: str | None
    grade_point: float | None
    credits_earned: float | None
    result_status: str | None
    class Config: from_attributes = True


class RegularResultOut(BaseModel):
    id: int
    hallticket: str
    academic_year: str
    regulation: str
    semester: str
    exam_type: str
    sgpa: str | None
    cgpa: str | None
    total_credits: str | None
    overall_result: str | None
    entries: list[EntryOut] = []
    class Config: from_attributes = True


def _enrich(rr, db: Session) -> dict:
    entries = regular_result_service.get_entries(db, rr.id)
    return {
        "id": rr.id,
        "hallticket": rr.hallticket,
        "academic_year": rr.academic_year,
        "regulation": rr.regulation,
        "semester": rr.semester,
        "exam_type": rr.exam_type,
        "sgpa": rr.sgpa,
        "cgpa": rr.cgpa,
        "total_credits": rr.total_credits,
        "overall_result": rr.overall_result,
        "entries": [
            {
                "id": e.id, "subject_id": e.subject_id, "subject_code": e.subject_code,
                "subject_name": e.subject_name, "credits": e.credits,
                "subject_type": e.subject_type, "internal_marks": e.internal_marks,
                "external_marks": e.external_marks, "total_marks": e.total_marks,
                "grade": e.grade, "grade_point": e.grade_point,
                "credits_earned": e.credits_earned, "result_status": e.result_status,
            }
            for e in entries
        ],
    }


@router.get("/regular-results/by-hallticket")
def list_by_hallticket(hallticket: str, db: Session = Depends(get_db)):
    results = regular_result_service.list_results_for_hallticket(db, hallticket)
    return [_enrich(r, db) for r in results]


@router.get("/regular-results/{result_id}")
def get_regular_result(result_id: int, db: Session = Depends(get_db)):
    rr = regular_result_service.get_regular_result_by_id(db, result_id)
    if not rr:
        raise HTTPException(status_code=404, detail="Result not found.")
    return _enrich(rr, db)


@router.post("/regular-results", status_code=201)
def save_regular_result(payload: RegularResultIn, db: Session = Depends(get_db)):
    # Validate student exists
    student = student_service.get_student_by_hallticket(db, payload.hallticket)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found. Please add the student first.")

    rr = regular_result_service.save_regular_result(
        db=db,
        hallticket=payload.hallticket,
        academic_year=payload.academic_year,
        regulation=payload.regulation,
        semester=payload.semester,
        exam_type=payload.exam_type,
        entries_data=[e.model_dump() for e in payload.entries],
        cgpa=payload.cgpa,
    )
    return _enrich(rr, db)


@router.delete("/regular-results/{result_id}", status_code=204)
def delete_regular_result(result_id: int, db: Session = Depends(get_db)):
    regular_result_service.delete_regular_result(db, result_id)


@router.get("/regular-results/{result_id}/failed-subjects")
def get_failed_subjects(result_id: int, db: Session = Depends(get_db)):
    """Returns only the failed entries for a given regular result — used by supplementary form."""
    entries = regular_result_service.get_failed_entries(db, result_id)
    return [
        {
            "id": e.id, "subject_id": e.subject_id, "subject_code": e.subject_code,
            "subject_name": e.subject_name, "credits": e.credits,
            "subject_type": e.subject_type,
        }
        for e in entries
    ]


@router.get("/subjects-for-entry")
def get_subjects_for_entry(branch: str, regulation: str, semester: str,
                            db: Session = Depends(get_db)):
    """
    Returns the subject list for a (branch, regulation, semester) to auto-populate
    the result entry form. Admin only needs to enter internal+external marks.
    """
    subjects = subject_service.get_subjects(db, branch, regulation, semester)
    if not subjects:
        raise HTTPException(
            status_code=404,
            detail=f"No subjects found for {branch}/{regulation}/{semester}. "
                   "Please add subjects first in Subject Management."
        )
    return [
        {
            "id": s.id, "subject_code": s.subject_code,
            "subject_name": s.subject_name, "credits": s.credits,
            "subject_type": s.subject_type,
        }
        for s in subjects
    ]
