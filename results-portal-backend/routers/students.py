"""Student management router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth import get_current_admin
from database import get_db
from services import student_service

router = APIRouter(dependencies=[Depends(get_current_admin)])


class StudentIn(BaseModel):
    hallticket: str
    student_name: str
    branch: str
    regulation: str
    batch: str | None = None
    photo: str | None = None


class StudentOut(BaseModel):
    id: int
    hallticket: str
    student_name: str
    branch: str
    regulation: str
    batch: str | None
    photo: str | None
    class Config: from_attributes = True


class StudentListOut(BaseModel):
    id: int
    hallticket: str
    student_name: str
    branch: str
    regulation: str
    batch: str | None
    class Config: from_attributes = True


class StudentPage(BaseModel):
    items: list[StudentListOut]
    total: int
    page: int
    page_size: int


@router.get("/students", response_model=StudentPage)
def list_students(search: str = None, branch: str = None, regulation: str = None,
                  page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    items, total = student_service.list_students(db, search, branch, regulation, page, page_size)
    return StudentPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/students/by-hallticket", response_model=StudentOut)
def get_by_hallticket(hallticket: str, db: Session = Depends(get_db)):
    s = student_service.get_student_by_hallticket(db, hallticket)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    return s


@router.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    s = student_service.get_student(db, student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    return s


@router.post("/students", response_model=StudentOut, status_code=201)
def create_student(payload: StudentIn, db: Session = Depends(get_db)):
    existing = student_service.get_student_by_hallticket(db, payload.hallticket)
    if existing:
        raise HTTPException(status_code=409, detail="Hall ticket already registered.")
    return student_service.create_student(db, payload.model_dump())


@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentIn, db: Session = Depends(get_db)):
    s = student_service.get_student(db, student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student_service.update_student(db, s, payload.model_dump())


@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    s = student_service.get_student(db, student_id)
    if not s:
        raise HTTPException(status_code=404, detail="Student not found.")
    student_service.delete_student(db, s)
