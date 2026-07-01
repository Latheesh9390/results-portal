"""
Supplementary result model.
When a student appears for a supplementary exam, only the failed subjects
from their regular result are shown. This model stores the updated marks
and updates the original regular result entry on pass.
"""

from sqlalchemy import Column, Float, ForeignKey, Integer, String
from database import Base


class SupplementaryResult(Base):
    """Header for a supplementary attempt."""

    __tablename__ = "supplementary_results"

    id = Column(Integer, primary_key=True, index=True)
    hallticket = Column(String(30), ForeignKey("students.hallticket", ondelete="CASCADE"),
                        nullable=False, index=True)
    academic_year = Column(String(20), nullable=False)  # supply exam year
    regulation = Column(String(20), nullable=False)
    semester = Column(String(10), nullable=False)
    # Reference to the original regular result header that is being re-attempted
    regular_result_id = Column(Integer, ForeignKey("regular_results.id", ondelete="CASCADE"),
                                nullable=True, index=True)
    sgpa = Column(String(10), nullable=True)
    cgpa = Column(String(10), nullable=True)
    total_credits = Column(String(10), nullable=True)
    overall_result = Column(String(10), nullable=True)  # PASS | FAIL


class SupplementaryResultEntry(Base):
    """One subject row in a supplementary attempt."""

    __tablename__ = "supplementary_result_entries"

    id = Column(Integer, primary_key=True, index=True)
    supp_result_id = Column(Integer,
                            ForeignKey("supplementary_results.id", ondelete="CASCADE"),
                            nullable=False, index=True)
    # References the original regular_result_entry that was failed
    regular_entry_id = Column(Integer,
                              ForeignKey("regular_result_entries.id", ondelete="CASCADE"),
                              nullable=True)
    subject_code = Column(String(30), nullable=False)
    subject_name = Column(String(200), nullable=False)
    credits = Column(Float, nullable=False, default=0)
    internal_marks = Column(Integer, nullable=True)
    external_marks = Column(Integer, nullable=True)
    total_marks = Column(Integer, nullable=True)
    grade = Column(String(5), nullable=True)
    grade_point = Column(Float, nullable=True)
    credits_earned = Column(Float, nullable=True)
    result_status = Column(String(10), nullable=True)  # PASS | FAIL
