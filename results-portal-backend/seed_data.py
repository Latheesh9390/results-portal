"""
Seed the database with sample master data + a complete student result.
Run: python seed_data.py
"""

from database import Base, SessionLocal, engine
import models  # registers all models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

from models.master import Branch, Regulation, AcademicYear, Semester
from models.subject import Subject
from models.student import Student
from models.regular_result import RegularResult, RegularResultEntry
from models.supplementary_result import SupplementaryResult, SupplementaryResultEntry

# Clear
for M in [SupplementaryResultEntry, SupplementaryResult,
          RegularResultEntry, RegularResult,
          Student, Subject, Semester, AcademicYear, Regulation, Branch]:
    db.query(M).delete()
db.commit()

# Master data
branches = ["CSE", "ECE", "EEE", "MECH", "CIVIL"]
for b in branches:
    db.add(Branch(name=b))

for r in ["R20", "R23"]:
    db.add(Regulation(name=r))

for y in ["2023-24", "2024-25", "2025-26"]:
    db.add(AcademicYear(name=y))

sems = [
    ("1-1", "I Year I Sem"), ("1-2", "I Year II Sem"),
    ("2-1", "II Year I Sem"), ("2-2", "II Year II Sem"),
    ("3-1", "III Year I Sem"), ("3-2", "III Year II Sem"),
    ("4-1", "IV Year I Sem"), ("4-2", "IV Year II Sem"),
]
for name, display in sems:
    db.add(Semester(name=name, display_name=display))

db.commit()

# Subjects for CSE/R23/3-1
sub_data = [
    ("23A05301", "Compiler Design", 4, "Theory"),
    ("23A05302", "Machine Learning", 4, "Theory"),
    ("23A05303", "Computer Networks", 4, "Theory"),
    ("23A05304", "Web Technologies", 3, "Theory"),
    ("23A05305", "ML Lab", 1.5, "Lab"),
]
subjects = []
for code, name, credits, stype in sub_data:
    s = Subject(branch="CSE", regulation="R23", semester="3-1",
                subject_code=code, subject_name=name, credits=credits, subject_type=stype)
    db.add(s)
    subjects.append(s)
db.commit()
for s in subjects:
    db.refresh(s)

# Student
student = Student(
    hallticket="22KD1A0501",
    student_name="RAMESH KUMAR",
    branch="CSE",
    regulation="R23",
    batch="2022-2026",
)
db.add(student)
db.commit()
db.refresh(student)

# Regular result — Web Technologies FAILS
rr = RegularResult(
    hallticket="22KD1A0501",
    academic_year="2025-26",
    regulation="R23",
    semester="3-1",
    exam_type="regular",
    sgpa="7.18",
    cgpa="7.50",
    total_credits="13.5",
    overall_result="FAIL",
)
db.add(rr)
db.flush()

marks_data = [
    (subjects[0].id, 28, 62),  # Compiler Design → 90 → O → PASS
    (subjects[1].id, 24, 56),  # ML → 80 → A+ → PASS
    (subjects[2].id, 26, 60),  # Networks → 86 → O → PASS
    (subjects[3].id, 21, 18),  # Web Tech → 39 → F → FAIL
    (subjects[4].id, 29, 67),  # ML Lab → 96 → S → PASS
]

from services.grade_utils import calculate_grade, is_pass

for sub_id, internal, external in marks_data:
    sub = next(s for s in subjects if s.id == sub_id)
    total = internal + external
    grade, gp = calculate_grade(total, sub.subject_type)
    passed = is_pass(internal, external, total, sub.subject_type)
    db.add(RegularResultEntry(
        result_id=rr.id,
        subject_id=sub.id,
        subject_code=sub.subject_code,
        subject_name=sub.subject_name,
        credits=sub.credits,
        subject_type=sub.subject_type,
        internal_marks=internal,
        external_marks=external,
        total_marks=total,
        grade=grade,
        grade_point=gp,
        credits_earned=sub.credits if passed else 0.0,
        result_status="PASS" if passed else "FAIL",
    ))

db.commit()
db.close()
print("Seed complete.")
print("  Student hall ticket: 22KD1A0501")
print("  Regular result (FAIL - Web Technologies failed)")
print("  Use supplementary entry to clear Web Technologies")
