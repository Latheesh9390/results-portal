"""
Student model — one row per student registration.
Photo is stored as a Base64 string (or file path).
"""

from sqlalchemy import Column, Integer, String, Text
from database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    hallticket = Column(String(30), unique=True, nullable=False, index=True)
    student_name = Column(String(200), nullable=False)
    branch = Column(String(50), nullable=False)       # FK-like: matches Branch.name
    regulation = Column(String(20), nullable=False)   # e.g. "R23"
    batch = Column(String(20), nullable=True)         # e.g. "2022-2026"
    photo = Column(Text, nullable=True)               # base64-encoded image or URL
