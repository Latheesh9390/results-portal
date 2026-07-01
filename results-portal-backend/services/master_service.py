"""Service layer for master data: Branches, Regulations, AcademicYears, Semesters."""

from sqlalchemy.orm import Session
from models.master import Branch, Regulation, AcademicYear, Semester


# ── Branches ──────────────────────────────────────────────────────────────────

def list_branches(db: Session):
    return db.query(Branch).order_by(Branch.name).all()


def create_branch(db: Session, name: str, full_name: str = None) -> Branch:
    existing = db.query(Branch).filter(Branch.name == name.upper().strip()).first()
    if existing:
        return existing
    b = Branch(name=name.upper().strip(), full_name=full_name)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


def delete_branch(db: Session, branch_id: int):
    b = db.query(Branch).filter(Branch.id == branch_id).first()
    if b:
        db.delete(b)
        db.commit()


# ── Regulations ───────────────────────────────────────────────────────────────

def list_regulations(db: Session):
    return db.query(Regulation).order_by(Regulation.name).all()


def create_regulation(db: Session, name: str) -> Regulation:
    existing = db.query(Regulation).filter(Regulation.name == name.upper().strip()).first()
    if existing:
        return existing
    r = Regulation(name=name.upper().strip())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def delete_regulation(db: Session, reg_id: int):
    r = db.query(Regulation).filter(Regulation.id == reg_id).first()
    if r:
        db.delete(r)
        db.commit()


# ── Academic Years ─────────────────────────────────────────────────────────────

def list_academic_years(db: Session):
    return db.query(AcademicYear).order_by(AcademicYear.name).all()


def create_academic_year(db: Session, name: str) -> AcademicYear:
    existing = db.query(AcademicYear).filter(AcademicYear.name == name.strip()).first()
    if existing:
        return existing
    ay = AcademicYear(name=name.strip())
    db.add(ay)
    db.commit()
    db.refresh(ay)
    return ay


def delete_academic_year(db: Session, ay_id: int):
    ay = db.query(AcademicYear).filter(AcademicYear.id == ay_id).first()
    if ay:
        db.delete(ay)
        db.commit()


# ── Semesters ──────────────────────────────────────────────────────────────────

def list_semesters(db: Session):
    return db.query(Semester).order_by(Semester.name).all()


def create_semester(db: Session, name: str, display_name: str = None) -> Semester:
    existing = db.query(Semester).filter(Semester.name == name.strip()).first()
    if existing:
        return existing
    s = Semester(name=name.strip(), display_name=display_name)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def delete_semester(db: Session, sem_id: int):
    s = db.query(Semester).filter(Semester.id == sem_id).first()
    if s:
        db.delete(s)
        db.commit()
