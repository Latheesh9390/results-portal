"""
Subject model.
Subjects are created ONCE per (branch, regulation, semester) combination
and automatically loaded whenever results are entered for that combination.
"""

from sqlalchemy import Column, Float, Integer, String, UniqueConstraint
from database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String(50), nullable=False)        # e.g. "CSE"
    regulation = Column(String(20), nullable=False)    # e.g. "R23"
    semester = Column(String(10), nullable=False)      # e.g. "3-1"
    subject_code = Column(String(30), nullable=False)  # e.g. "23A05301"
    subject_name = Column(String(200), nullable=False) # e.g. "Compiler Design"
    credits = Column(Float, nullable=False, default=0)
    subject_type = Column(String(20), nullable=False, default="Theory")  # Theory | Lab

    __table_args__ = (
        UniqueConstraint("branch", "regulation", "semester", "subject_code", name="uq_subject"),
    )
