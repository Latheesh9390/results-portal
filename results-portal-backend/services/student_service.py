"""Student CRUD service."""

from sqlalchemy.orm import Session
from models.student import Student


def list_students(db: Session, search: str = None, branch: str = None,
                  regulation: str = None, page: int = 1, page_size: int = 20):
    q = db.query(Student)
    if search:
        like = f"%{search.strip()}%"
        q = q.filter(
            (Student.hallticket.ilike(like)) | (Student.student_name.ilike(like))
        )
    if branch:
        q = q.filter(Student.branch.ilike(branch))
    if regulation:
        q = q.filter(Student.regulation.ilike(regulation))
    total = q.count()
    items = q.order_by(Student.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_student(db: Session, student_id: int) -> Student | None:
    return db.query(Student).filter(Student.id == student_id).first()


def get_student_by_hallticket(db: Session, hallticket: str) -> Student | None:
    return (
        db.query(Student)
        .filter(Student.hallticket == hallticket.strip().upper())
        .first()
    )


def create_student(db: Session, data: dict) -> Student:
    s = Student(
        hallticket=data["hallticket"].strip().upper(),
        student_name=data["student_name"].strip(),
        branch=data["branch"].strip().upper(),
        regulation=data.get("regulation", "").strip().upper(),
        batch=data.get("batch", "").strip(),
        photo=data.get("photo"),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_student(db: Session, student: Student, data: dict) -> Student:
    student.student_name = data["student_name"].strip()
    student.branch = data["branch"].strip().upper()
    student.regulation = data.get("regulation", student.regulation).strip().upper()
    student.batch = data.get("batch", student.batch or "").strip()
    if data.get("photo") is not None:
        student.photo = data["photo"]
    db.commit()
    db.refresh(student)
    return student


def delete_student(db: Session, student: Student):
    db.delete(student)
    db.commit()
