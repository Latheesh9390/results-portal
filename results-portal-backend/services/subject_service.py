"""Service for Subject management — stored once per branch/regulation/semester."""

from sqlalchemy.orm import Session
from models.subject import Subject


def get_subjects(db: Session, branch: str, regulation: str, semester: str) -> list[Subject]:
    return (
        db.query(Subject)
        .filter(
            Subject.branch == branch.upper().strip(),
            Subject.regulation == regulation.upper().strip(),
            Subject.semester == semester.strip(),
        )
        .order_by(Subject.id)
        .all()
    )


def create_subject(db: Session, branch: str, regulation: str, semester: str,
                   subject_code: str, subject_name: str,
                   credits: float, subject_type: str) -> Subject:
    # Avoid duplicates
    existing = (
        db.query(Subject)
        .filter(
            Subject.branch == branch.upper().strip(),
            Subject.regulation == regulation.upper().strip(),
            Subject.semester == semester.strip(),
            Subject.subject_code == subject_code.strip(),
        )
        .first()
    )
    if existing:
        existing.subject_name = subject_name.strip()
        existing.credits = credits
        existing.subject_type = subject_type.strip()
        db.commit()
        db.refresh(existing)
        return existing

    s = Subject(
        branch=branch.upper().strip(),
        regulation=regulation.upper().strip(),
        semester=semester.strip(),
        subject_code=subject_code.strip(),
        subject_name=subject_name.strip(),
        credits=credits,
        subject_type=subject_type.strip(),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_subject(db: Session, subject_id: int, data: dict) -> Subject | None:
    s = db.query(Subject).filter(Subject.id == subject_id).first()
    if not s:
        return None
    for k, v in data.items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


def delete_subject(db: Session, subject_id: int):
    s = db.query(Subject).filter(Subject.id == subject_id).first()
    if s:
        db.delete(s)
        db.commit()


def bulk_create_subjects(db: Session, branch: str, regulation: str, semester: str,
                         subjects: list[dict]) -> list[Subject]:
    result = []
    for sub in subjects:
        s = create_subject(
            db, branch, regulation, semester,
            sub["subject_code"], sub["subject_name"],
            sub["credits"], sub.get("subject_type", "Theory"),
        )
        result.append(s)
    return result
