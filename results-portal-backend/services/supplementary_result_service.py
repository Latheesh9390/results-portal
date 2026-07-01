"""
Supplementary result service.
- Finds only failed subjects from the regular result.
- Admin enters internal+external for those subjects only.
- Auto-calculates totals/grades.
- On pass: updates the original RegularResultEntry, recalculates SGPA, updates overall_result.
"""

from sqlalchemy.orm import Session
from models.regular_result import RegularResult, RegularResultEntry
from models.supplementary_result import SupplementaryResult, SupplementaryResultEntry
from services.grade_utils import calculate_grade, is_pass, compute_sgpa


def get_failed_subjects_for_supply(db: Session, hallticket: str, semester: str) -> dict:
    """
    Returns the regular result header + list of failed entries for a given student/semester.
    Used to pre-populate the supplementary entry form.
    """
    # Get most recent regular result for this hallticket+semester
    rr = (
        db.query(RegularResult)
        .filter(
            RegularResult.hallticket == hallticket.upper().strip(),
            RegularResult.semester == semester.strip(),
            RegularResult.exam_type == "regular",
        )
        .order_by(RegularResult.id.desc())
        .first()
    )
    if rr is None:
        return None

    failed = (
        db.query(RegularResultEntry)
        .filter(
            RegularResultEntry.result_id == rr.id,
            RegularResultEntry.result_status == "FAIL",
        )
        .all()
    )
    return {"regular_result": rr, "failed_entries": failed}


def save_supplementary_result(db: Session, hallticket: str, academic_year: str,
                               regulation: str, semester: str,
                               regular_result_id: int,
                               entries_data: list[dict]) -> SupplementaryResult:
    """
    entries_data: [{regular_entry_id, internal_marks, external_marks}, ...]
    """
    hallticket = hallticket.strip().upper()

    # Load the original failed entries by id
    entry_map = {}
    for ed in entries_data:
        entry = db.query(RegularResultEntry).filter(
            RegularResultEntry.id == ed["regular_entry_id"]
        ).first()
        if entry:
            entry_map[ed["regular_entry_id"]] = (entry, ed)

    # Compute for each
    computed = []
    for reg_entry_id, (entry, ed) in entry_map.items():
        internal = ed.get("internal_marks")
        external = ed.get("external_marks")
        total = None
        if internal is not None and external is not None:
            total = internal + external

        if total is not None:
            grade, gp = calculate_grade(total, entry.subject_type)
            passed = is_pass(internal, external, total, entry.subject_type)
            status = "PASS" if passed else "FAIL"
            credits_earned = entry.credits if passed else 0.0
        else:
            grade, gp, status, credits_earned = None, None, None, 0.0

        computed.append({
            "regular_entry_id": reg_entry_id,
            "entry": entry,
            "internal_marks": internal,
            "external_marks": external,
            "total_marks": total,
            "grade": grade,
            "grade_point": gp,
            "credits_earned": credits_earned,
            "result_status": status,
        })

    # Upsert supplementary header (one per hallticket+academic_year+semester)
    sr = (
        db.query(SupplementaryResult)
        .filter(
            SupplementaryResult.hallticket == hallticket,
            SupplementaryResult.academic_year == academic_year.strip(),
            SupplementaryResult.semester == semester.strip(),
        )
        .first()
    )
    if sr is None:
        sr = SupplementaryResult(
            hallticket=hallticket,
            academic_year=academic_year.strip(),
            regulation=regulation.upper().strip(),
            semester=semester.strip(),
            regular_result_id=regular_result_id,
        )
        db.add(sr)
        db.flush()

    # Remove old supp entries
    db.query(SupplementaryResultEntry).filter(
        SupplementaryResultEntry.supp_result_id == sr.id
    ).delete()

    for c in computed:
        se = SupplementaryResultEntry(
            supp_result_id=sr.id,
            regular_entry_id=c["regular_entry_id"],
            subject_code=c["entry"].subject_code,
            subject_name=c["entry"].subject_name,
            credits=c["entry"].credits,
            internal_marks=c["internal_marks"],
            external_marks=c["external_marks"],
            total_marks=c["total_marks"],
            grade=c["grade"],
            grade_point=c["grade_point"],
            credits_earned=c["credits_earned"],
            result_status=c["result_status"],
        )
        db.add(se)

    db.flush()

    # Update original regular result entries that now PASS
    regular_result = db.query(RegularResult).filter(
        RegularResult.id == regular_result_id
    ).first()

    for c in computed:
        if c["result_status"] == "PASS":
            orig = db.query(RegularResultEntry).filter(
                RegularResultEntry.id == c["regular_entry_id"]
            ).first()
            if orig:
                orig.internal_marks = c["internal_marks"]
                orig.external_marks = c["external_marks"]
                orig.total_marks = c["total_marks"]
                orig.grade = c["grade"]
                orig.grade_point = c["grade_point"]
                orig.credits_earned = c["credits_earned"]
                orig.result_status = "PASS"

    db.flush()

    # Recalculate SGPA and overall_result on the regular result
    if regular_result:
        all_entries = db.query(RegularResultEntry).filter(
            RegularResultEntry.result_id == regular_result.id
        ).all()

        entry_dicts = [
            {"grade_point": e.grade_point, "credits_earned": e.credits_earned or 0}
            for e in all_entries
        ]
        new_sgpa = compute_sgpa(entry_dicts)
        new_credits = sum(e.credits_earned or 0 for e in all_entries)
        new_overall = "FAIL" if any(e.result_status == "FAIL" for e in all_entries) else "PASS"

        regular_result.sgpa = str(new_sgpa)
        regular_result.total_credits = str(round(new_credits, 2))
        regular_result.overall_result = new_overall

        # Update supplementary result summary
        sr.sgpa = str(new_sgpa)
        sr.total_credits = str(round(new_credits, 2))
        sr.overall_result = new_overall

    db.commit()
    db.refresh(sr)
    return sr


def get_supplementary_result(db: Session, sr_id: int) -> SupplementaryResult | None:
    return db.query(SupplementaryResult).filter(SupplementaryResult.id == sr_id).first()


def get_supp_entries(db: Session, sr_id: int) -> list[SupplementaryResultEntry]:
    return (
        db.query(SupplementaryResultEntry)
        .filter(SupplementaryResultEntry.supp_result_id == sr_id)
        .all()
    )
