"""
Regular result model.
One ResultEntry row per subject per (student, academic_year, semester) attempt.
Totals, grades, grade points are auto-calculated on save.
"""

from sqlalchemy import Column, Float, ForeignKey, Integer, String, UniqueConstraint
from database import Base


class RegularResult(Base):
    """Header record for one student's regular exam attempt in a given semester."""

    __tablename__ = "regular_results"

    id = Column(Integer, primary_key=True, index=True)
    hallticket = Column(String(30), ForeignKey("students.hallticket", ondelete="CASCADE"),
                        nullable=False, index=True)
    academic_year = Column(String(20), nullable=False)   # e.g. "2025-26"
    regulation = Column(String(20), nullable=False)      # e.g. "R23"
    semester = Column(String(10), nullable=False)        # e.g. "3-1"
    exam_type = Column(String(20), nullable=False, default="regular")
    sgpa = Column(String(10), nullable=True)
    cgpa = Column(String(10), nullable=True)
    total_credits = Column(String(10), nullable=True)
    overall_result = Column(String(10), nullable=True)   # PASS | FAIL

    __table_args__ = (
        UniqueConstraint("hallticket", "academic_year", "semester", "exam_type",
                         name="uq_regular_result"),
    )


class RegularResultEntry(Base):
    """One subject row inside a regular result."""

    __tablename__ = "regular_result_entries"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("regular_results.id", ondelete="CASCADE"),
                       nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    subject_code = Column(String(30), nullable=False)
    subject_name = Column(String(200), nullable=False)
    credits = Column(Float, nullable=False, default=0)
    subject_type = Column(String(20), nullable=True)    # Theory | Lab
    internal_marks = Column(Integer, nullable=True)     # 0–30
    external_marks = Column(Integer, nullable=True)     # 0–70
    total_marks = Column(Integer, nullable=True)        # auto-computed
    grade = Column(String(5), nullable=True)            # O, A+, A, B+, B, C, F
    grade_point = Column(Float, nullable=True)          # 10, 9, 8, 7, 6, 5, 0
    credits_earned = Column(Float, nullable=True)       # 0 if failed
    result_status = Column(String(10), nullable=True)   # PASS | FAIL
