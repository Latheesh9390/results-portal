"""
Master data models: Branch, Regulation, AcademicYear, Semester
Created once by the admin, reused forever.
"""

from sqlalchemy import Column, Integer, String, UniqueConstraint
from database import Base


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)   # e.g. "CSE"
    full_name = Column(String(200), nullable=True)            # e.g. "Computer Science & Engineering"


class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)   # e.g. "R23"


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)   # e.g. "2023-24"


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(10), unique=True, nullable=False)   # e.g. "1-1", "3-2"
    display_name = Column(String(50), nullable=True)          # e.g. "I Year I Semester"
