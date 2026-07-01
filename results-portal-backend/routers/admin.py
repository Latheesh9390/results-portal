from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from auth import get_current_admin, hash_password, verify_password
from database import get_db
from models.admin import Admin
from models.student import Student
from schemas.auth import ChangePasswordRequest
from schemas.student import DashboardStats, StudentAdminOut, StudentIn, StudentPage
from services import admin_service

# Every route in this file requires a valid admin Bearer token.
# Students never receive a token so they can never call any of these routes.
router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    return admin_service.get_dashboard_stats(db)


@router.get("/students", response_model=StudentPage)
def list_students(
    search: str | None = None,
    branch: str | None = None,
    exam_type: str | None = None,
    overall_result: str | None = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    items, total = admin_service.list_students(
        db, search, branch, exam_type, overall_result, page, page_size
    )
    return StudentPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/students/by-hallticket", response_model=StudentAdminOut)
def get_student_by_hallticket(
    hallticket: str,
    exam_type: str = "regular",
    db: Session = Depends(get_db),
):
    """
    Quick-add / Quick-update lookup: find an existing student by hall ticket
    number and exam type so the admin can pre-fill the form without hunting
    for the record's numeric ID.

    Returns 404 if no matching student is found — the frontend uses that signal
    to switch into "new record" mode.
    """
    student = (
        db.query(Student)
        .filter(
            Student.hallticket == hallticket.strip().upper(),
            Student.exam_type == exam_type.lower(),
        )
        .first()
    )
    if student is None:
        raise HTTPException(status_code=404, detail="No result found for this hall ticket.")
    return student


@router.get("/students/{student_id}", response_model=StudentAdminOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = admin_service.get_student(db, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student


@router.post("/students", response_model=StudentAdminOut, status_code=201)
def create_student(payload: StudentIn, db: Session = Depends(get_db)):
    return admin_service.create_student(db, payload)


@router.put("/students/{student_id}", response_model=StudentAdminOut)
def update_student(student_id: int, payload: StudentIn, db: Session = Depends(get_db)):
    student = admin_service.get_student(db, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    return admin_service.update_student(db, student, payload)


@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = admin_service.get_student(db, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    admin_service.delete_student(db, student)


@router.post("/students/import-csv")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")
    content = await file.read()
    try:
        summary = admin_service.import_csv(db, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return summary


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    admin.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"status": "ok"}
