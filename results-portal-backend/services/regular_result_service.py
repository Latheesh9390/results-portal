"""
Regular result entry service.
Auto-calculates: Total, Grade, Grade Point, Credits Earned, Status, SGPA, Overall Result.
"""

from sqlalchemy.orm import Session
from models.regular_result import RegularResult, RegularResultEntry
from models.subject import Subject
from services.grade_utils import calculate_grade, is_pass, compute_sgpa


def get_regular_result(db: Session, hallticket: str, academic_year: str, semester: str,
                        exam_type: str = "regular") -> RegularResult | None:
    return (
        db.query(RegularResult)
        .filter(
            RegularResult.hallticket == hallticket.upper().strip(),
            RegularResult.academic_year == academic_year.strip(),
            RegularResult.semester == semester.strip(),
            RegularResult.exam_type == exam_type.lower(),
        )
        .first()
    )


def get_regular_result_by_id(db: Session, result_id: int) -> RegularResult | None:
    return db.query(RegularResult).filter(RegularResult.id == result_id).first()


def get_entries(db: Session, result_id: int) -> list[RegularResultEntry]:
    return (
        db.query(RegularResultEntry)
        .filter(RegularResultEntry.result_id == result_id)
        .order_by(RegularResultEntry.id)
        .all()
    )


def list_results_for_hallticket(db: Session, hallticket: str) -> list[RegularResult]:
    return (
        db.query(RegularResult)
        .filter(RegularResult.hallticket == hallticket.upper().strip())
        .order_by(RegularResult.id.desc())
        .all()
    )


def save_regular_result(db: Session, hallticket: str, academic_year: str, regulation: str,
                         semester: str, exam_type: str,
                         entries_data: list[dict],
                         cgpa: str = None) -> RegularResult:
    """
    Create or update a regular result.
    entries_data: list of {subject_id, internal_marks, external_marks}
    Auto-computes total, grade, grade_point, credits_earned, result_status for each entry.
    Auto-computes SGPA and overall_result.
    """
    hallticket = hallticket.strip().upper()

    # Load subject definitions
    subjects = {s.id: s for s in db.query(Subject).filter(
        Subject.branch != ""  # all subjects
    ).all()}

    # Build computed entries
    computed = []
    for ed in entries_data:
        subject = subjects.get(ed["subject_id"])
        if not subject:
            continue
        internal = ed.get("internal_marks")
        external = ed.get("external_marks")
        total = None
        if internal is not None and external is not None:
            total = internal + external
        elif internal is not None:
            total = internal

        if total is not None:
            grade, gp = calculate_grade(total, subject.subject_type)
            passed = is_pass(internal, external, total, subject.subject_type)
            status = "PASS" if passed else "FAIL"
            credits_earned = subject.credits if passed else 0.0
        else:
            grade, gp, status, credits_earned = None, None, None, 0.0

        computed.append({
            "subject_id": subject.id,
            "subject_code": subject.subject_code,
            "subject_name": subject.subject_name,
            "credits": subject.credits,
            "subject_type": subject.subject_type,
            "internal_marks": internal,
            "external_marks": external,
            "total_marks": total,
            "grade": grade,
            "grade_point": gp,
            "credits_earned": credits_earned,
            "result_status": status,
        })

    # Compute SGPA
    sgpa = compute_sgpa(computed)
    total_credits = sum(c["credits_earned"] for c in computed)
    overall = "FAIL" if any(c["result_status"] == "FAIL" for c in computed if c["result_status"]) else "PASS"

    # Upsert header
    rr = get_regular_result(db, hallticket, academic_year, semester, exam_type)
    if rr is None:
        rr = RegularResult(
            hallticket=hallticket,
            academic_year=academic_year.strip(),
            regulation=regulation.upper().strip(),
            semester=semester.strip(),
            exam_type=exam_type.lower(),
        )
        db.add(rr)
        db.flush()
    rr.sgpa = str(sgpa)
    rr.cgpa = cgpa
    rr.total_credits = str(round(total_credits, 2))
    rr.overall_result = overall

    # Replace entries
    db.query(RegularResultEntry).filter(RegularResultEntry.result_id == rr.id).delete()
    for c in computed:
        entry = RegularResultEntry(
            result_id=rr.id,
            subject_id=c["subject_id"],
            subject_code=c["subject_code"],
            subject_name=c["subject_name"],
            credits=c["credits"],
            subject_type=c["subject_type"],
            internal_marks=c["internal_marks"],
            external_marks=c["external_marks"],
            total_marks=c["total_marks"],
            grade=c["grade"],
            grade_point=c["grade_point"],
            credits_earned=c["credits_earned"],
            result_status=c["result_status"],
        )
        db.add(entry)

    db.commit()
    db.refresh(rr)
    return rr


def delete_regular_result(db: Session, result_id: int):
    rr = db.query(RegularResult).filter(RegularResult.id == result_id).first()
    if rr:
        db.delete(rr)
        db.commit()


def get_failed_entries(db: Session, result_id: int) -> list[RegularResultEntry]:
    """Returns entries that are still FAIL (not yet cleared by supplementary)."""
    return (
        db.query(RegularResultEntry)
        .filter(
            RegularResultEntry.result_id == result_id,
            RegularResultEntry.result_status == "FAIL",
        )
        .all()
    )
