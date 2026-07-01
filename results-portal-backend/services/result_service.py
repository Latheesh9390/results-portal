from sqlalchemy.orm import Session

from models.student import Student


def get_memo(db: Session, hallticket: str, exam_type: str) -> Student | None:
    """Look up a student's full marks memo by hall ticket + exam type.

    Hall ticket numbers are matched case-insensitively since students often
    type them in lowercase on mobile keyboards.
    """
    return (
        db.query(Student)
        .filter(
            Student.hallticket.ilike(hallticket.strip()),
            Student.exam_type == exam_type.lower(),
        )
        .first()
    )
