"""
Grade calculation rules for JNTUA R23 regulation.

Grading scale (marks out of 100):
  90-100 → S   (Super/Outstanding) GP=10
  80-89  → A+  (Excellent)         GP=9
  70-79  → A   (Very Good)         GP=8
  60-69  → B+  (Good)              GP=7
  50-59  → B   (Above Average)     GP=6
  40-49  → C   (Pass)              GP=5
  <40    → F   (Fail)              GP=0
  Absent → Ab  (Absent)            GP=0

For Lab/Practicals:
  S (≥90), A+ (80-89), A (70-79), B+ (60-69), B (50-59), F (<50)

Passing criteria:
  Theory: Internal ≥ 12, External ≥ 28, Total ≥ 40
  Lab:    Total ≥ 50
"""

from __future__ import annotations


def calculate_grade(total: int, subject_type: str = "Theory") -> tuple[str, float]:
    """Returns (grade_letter, grade_point)."""
    if subject_type and subject_type.lower() in ("lab", "practical"):
        # Lab passing mark is 50
        if total >= 90:
            return "S", 10.0
        elif total >= 80:
            return "A+", 9.0
        elif total >= 70:
            return "A", 8.0
        elif total >= 60:
            return "B+", 7.0
        elif total >= 50:
            return "B", 6.0
        else:
            return "F", 0.0
    else:
        # Theory
        if total >= 90:
            return "S", 10.0
        elif total >= 80:
            return "A+", 9.0
        elif total >= 70:
            return "A", 8.0
        elif total >= 60:
            return "B+", 7.0
        elif total >= 50:
            return "B", 6.0
        elif total >= 40:
            return "C", 5.0
        else:
            return "F", 0.0


def is_pass(internal: int | None, external: int | None, total: int,
            subject_type: str = "Theory") -> bool:
    """Determine if a student passes this subject."""
    if subject_type and subject_type.lower() in ("lab", "practical"):
        return total >= 50
    # Theory: all three conditions must hold
    i_pass = (internal is None) or (internal >= 12)
    e_pass = (external is None) or (external >= 28)
    t_pass = total >= 40
    return i_pass and e_pass and t_pass


def compute_sgpa(entries: list[dict]) -> float:
    """
    SGPA = Sum(Grade_Point * Credits) / Sum(Credits_Earned)
    Only credits from passed subjects count.
    """
    total_gp_credits = 0.0
    total_credits = 0.0
    for e in entries:
        if e.get("credits_earned", 0) and e.get("credits_earned", 0) > 0:
            total_gp_credits += (e.get("grade_point", 0) or 0) * e["credits_earned"]
            total_credits += e["credits_earned"]
    if total_credits == 0:
        return 0.0
    return round(total_gp_credits / total_credits, 2)
