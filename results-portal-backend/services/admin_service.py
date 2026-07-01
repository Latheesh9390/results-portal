"""
Business logic for the admin dashboard: creating/editing/deleting student
results, listing/searching them, and computing dashboard stats.

Kept separate from result_service.py, which only ever handles the public
student search - that file is intentionally untouched so the
student-facing flow can't be affected by anything that happens here.
"""

import csv
import io

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.result import ResultRow
from models.student import Student
from schemas.student import StudentIn


def _apply_row(row: ResultRow, item) -> None:
    row.subject_code = item.subject_code
    row.subject_name = item.subject_name
    row.internal_marks = item.internal_marks
    row.external_marks = item.external_marks
    # Auto-compute total marks if the admin didn't type one in.
    if item.total_marks is not None:
        row.total_marks = item.total_marks
    elif item.internal_marks is not None and item.external_marks is not None:
        row.total_marks = item.internal_marks + item.external_marks
    else:
        row.total_marks = None
    row.result_status = item.result_status.upper()
    row.credits = item.credits
    row.grade = item.grade


def _compute_overall_result(payload: StudentIn) -> str:
    if payload.overall_result:
        return payload.overall_result.upper()
    if any(r.result_status.upper() == "F" for r in payload.results):
        return "FAIL"
    return "PASS"


def list_students(
    db: Session,
    search: str | None,
    branch: str | None,
    exam_type: str | None,
    overall_result: str | None,
    page: int,
    page_size: int,
):
    query = db.query(Student)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            (Student.hallticket.ilike(like)) | (Student.student_name.ilike(like))
        )
    if branch:
        query = query.filter(Student.branch.ilike(branch))
    if exam_type:
        query = query.filter(Student.exam_type == exam_type.lower())
    if overall_result:
        query = query.filter(Student.overall_result.ilike(overall_result))

    total = query.count()
    items = (
        query.order_by(Student.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_student(db: Session, student_id: int) -> Student | None:
    return db.query(Student).filter(Student.id == student_id).first()


def create_student(db: Session, payload: StudentIn) -> Student:
    student = Student(
        hallticket=payload.hallticket.strip().upper(),
        student_name=payload.student_name.strip(),
        branch=payload.branch.strip().upper(),
        semester=payload.semester.strip(),
        exam_type=payload.exam_type.lower(),
        exam_title=payload.exam_title.strip(),
        sgpa=payload.sgpa,
        cgpa=payload.cgpa,
        total_credits=payload.total_credits,
        overall_result=_compute_overall_result(payload),
    )
    db.add(student)
    db.flush()

    for item in payload.results:
        row = ResultRow(student_id=student.id, subject_code="", subject_name="")
        _apply_row(row, item)
        db.add(row)

    db.commit()
    db.refresh(student)
    return student


def update_student(db: Session, student: Student, payload: StudentIn) -> Student:
    student.hallticket = payload.hallticket.strip().upper()
    student.student_name = payload.student_name.strip()
    student.branch = payload.branch.strip().upper()
    student.semester = payload.semester.strip()
    student.exam_type = payload.exam_type.lower()
    student.exam_title = payload.exam_title.strip()
    student.sgpa = payload.sgpa
    student.cgpa = payload.cgpa
    student.total_credits = payload.total_credits
    student.overall_result = _compute_overall_result(payload)

    # Simplest, safest way to keep subject rows in sync with the form: drop
    # the old ones and re-insert what was submitted, all in one transaction.
    db.query(ResultRow).filter(ResultRow.student_id == student.id).delete()
    for item in payload.results:
        row = ResultRow(student_id=student.id, subject_code="", subject_name="")
        _apply_row(row, item)
        db.add(row)

    db.commit()
    db.refresh(student)
    return student


def delete_student(db: Session, student: Student) -> None:
    db.delete(student)
    db.commit()


def get_dashboard_stats(db: Session) -> dict:
    total_students = db.query(func.count(Student.id)).scalar() or 0
    total_pass = (
        db.query(func.count(Student.id)).filter(Student.overall_result == "PASS").scalar() or 0
    )
    total_fail = (
        db.query(func.count(Student.id)).filter(Student.overall_result == "FAIL").scalar() or 0
    )

    by_branch = dict(
        db.query(Student.branch, func.count(Student.id)).group_by(Student.branch).all()
    )
    by_exam_type = dict(
        db.query(Student.exam_type, func.count(Student.id)).group_by(Student.exam_type).all()
    )

    return {
        "total_students": total_students,
        "total_pass": total_pass,
        "total_fail": total_fail,
        "by_branch": by_branch,
        "by_exam_type": by_exam_type,
    }


# ---------------------------------------------------------------------------
# Bulk CSV import - lets an admin add many subject rows in one go instead of
# typing each one into the form. Expected columns (header row required):
#
#   hallticket, student_name, branch, semester, exam_type, exam_title,
#   subject_code, subject_name, internal_marks, external_marks, total_marks,
#   result_status, credits, grade, sgpa, cgpa, total_credits, overall_result
#
# Multiple rows with the same hallticket+exam_type are grouped into one
# student with multiple subject rows. sgpa/cgpa/etc only need to be filled
# in on one row per student (the rest can be left blank).
# ---------------------------------------------------------------------------


def import_csv(db: Session, file_bytes: bytes) -> dict:
    text = file_bytes.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    required = {"hallticket", "student_name", "branch", "semester", "exam_title", "subject_code", "subject_name"}
    missing = required - set(h.strip() for h in (reader.fieldnames or []))
    if missing:
        raise ValueError(f"CSV is missing required column(s): {', '.join(sorted(missing))}")

    grouped: dict[tuple[str, str], StudentIn] = {}

    for raw in reader:
        row = {k.strip(): (v or "").strip() for k, v in raw.items()}
        hallticket = row["hallticket"].upper()
        exam_type = (row.get("exam_type") or "regular").lower()
        key = (hallticket, exam_type)

        if key not in grouped:
            grouped[key] = StudentIn(
                hallticket=hallticket,
                student_name=row["student_name"],
                branch=row["branch"],
                semester=row["semester"],
                exam_type=exam_type,
                exam_title=row["exam_title"],
                sgpa=row.get("sgpa") or None,
                cgpa=row.get("cgpa") or None,
                total_credits=row.get("total_credits") or None,
                overall_result=row.get("overall_result") or None,
                results=[],
            )

        student_in = grouped[key]
        if row.get("sgpa"):
            student_in.sgpa = row["sgpa"]
        if row.get("cgpa"):
            student_in.cgpa = row["cgpa"]
        if row.get("total_credits"):
            student_in.total_credits = row["total_credits"]
        if row.get("overall_result"):
            student_in.overall_result = row["overall_result"]

        def to_int(v):
            return int(v) if v not in (None, "") else None

        def to_float(v):
            return float(v) if v not in (None, "") else 0

        student_in.results.append(
            {
                "subject_code": row["subject_code"],
                "subject_name": row["subject_name"],
                "internal_marks": to_int(row.get("internal_marks")),
                "external_marks": to_int(row.get("external_marks")),
                "total_marks": to_int(row.get("total_marks")),
                "result_status": (row.get("result_status") or "P").upper(),
                "credits": to_float(row.get("credits")),
                "grade": row.get("grade") or None,
            }
        )

    created, updated = 0, 0
    for (hallticket, exam_type), student_in in grouped.items():
        # Pydantic v2 lets us re-validate the raw dicts we appended into `results`.
        student_in = StudentIn.model_validate(student_in.model_dump())

        existing = (
            db.query(Student)
            .filter(Student.hallticket == hallticket, Student.exam_type == exam_type)
            .first()
        )
        if existing:
            update_student(db, existing, student_in)
            updated += 1
        else:
            create_student(db, student_in)
            created += 1

    return {"created": created, "updated": updated, "students_in_file": len(grouped)}
