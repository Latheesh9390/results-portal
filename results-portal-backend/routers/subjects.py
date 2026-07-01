"""Subject management router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth import get_current_admin
from database import get_db
from services import subject_service

router = APIRouter(dependencies=[Depends(get_current_admin)])


class SubjectIn(BaseModel):
    branch: str
    regulation: str
    semester: str
    subject_code: str
    subject_name: str
    credits: float
    subject_type: str = "Theory"


class SubjectOut(BaseModel):
    id: int
    branch: str
    regulation: str
    semester: str
    subject_code: str
    subject_name: str
    credits: float
    subject_type: str
    class Config: from_attributes = True


class BulkSubjectIn(BaseModel):
    branch: str
    regulation: str
    semester: str
    subjects: list[dict]


@router.get("/subjects", response_model=list[SubjectOut])
def get_subjects(branch: str, regulation: str, semester: str,
                 db: Session = Depends(get_db)):
    return subject_service.get_subjects(db, branch, regulation, semester)


@router.post("/subjects", response_model=SubjectOut, status_code=201)
def create_subject(payload: SubjectIn, db: Session = Depends(get_db)):
    return subject_service.create_subject(
        db, payload.branch, payload.regulation, payload.semester,
        payload.subject_code, payload.subject_name, payload.credits, payload.subject_type,
    )


@router.put("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, payload: SubjectIn, db: Session = Depends(get_db)):
    s = subject_service.update_subject(db, subject_id, {
        "subject_name": payload.subject_name,
        "credits": payload.credits,
        "subject_type": payload.subject_type,
    })
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return s


@router.delete("/subjects/{subject_id}", status_code=204)
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject_service.delete_subject(db, subject_id)


@router.post("/subjects/bulk", response_model=list[SubjectOut], status_code=201)
def bulk_create_subjects(payload: BulkSubjectIn, db: Session = Depends(get_db)):
    return subject_service.bulk_create_subjects(
        db, payload.branch, payload.regulation, payload.semester, payload.subjects
    )
