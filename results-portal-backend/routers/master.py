"""Router for master data: Branches, Regulations, Academic Years, Semesters."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth import get_current_admin
from database import get_db
from services import master_service

router = APIRouter(dependencies=[Depends(get_current_admin)])


# ── Schemas ───────────────────────────────────────────────────────────────────

class BranchIn(BaseModel):
    name: str
    full_name: str | None = None


class BranchOut(BaseModel):
    id: int
    name: str
    full_name: str | None
    class Config: from_attributes = True


class RegulationIn(BaseModel):
    name: str


class RegulationOut(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True


class AcademicYearIn(BaseModel):
    name: str


class AcademicYearOut(BaseModel):
    id: int
    name: str
    class Config: from_attributes = True


class SemesterIn(BaseModel):
    name: str
    display_name: str | None = None


class SemesterOut(BaseModel):
    id: int
    name: str
    display_name: str | None
    class Config: from_attributes = True


# ── Branches ──────────────────────────────────────────────────────────────────

@router.get("/branches", response_model=list[BranchOut])
def list_branches(db: Session = Depends(get_db)):
    return master_service.list_branches(db)


@router.post("/branches", response_model=BranchOut, status_code=201)
def create_branch(payload: BranchIn, db: Session = Depends(get_db)):
    return master_service.create_branch(db, payload.name, payload.full_name)


@router.delete("/branches/{branch_id}", status_code=204)
def delete_branch(branch_id: int, db: Session = Depends(get_db)):
    master_service.delete_branch(db, branch_id)


# ── Regulations ───────────────────────────────────────────────────────────────

@router.get("/regulations", response_model=list[RegulationOut])
def list_regulations(db: Session = Depends(get_db)):
    return master_service.list_regulations(db)


@router.post("/regulations", response_model=RegulationOut, status_code=201)
def create_regulation(payload: RegulationIn, db: Session = Depends(get_db)):
    return master_service.create_regulation(db, payload.name)


@router.delete("/regulations/{reg_id}", status_code=204)
def delete_regulation(reg_id: int, db: Session = Depends(get_db)):
    master_service.delete_regulation(db, reg_id)


# ── Academic Years ─────────────────────────────────────────────────────────────

@router.get("/academic-years", response_model=list[AcademicYearOut])
def list_academic_years(db: Session = Depends(get_db)):
    return master_service.list_academic_years(db)


@router.post("/academic-years", response_model=AcademicYearOut, status_code=201)
def create_academic_year(payload: AcademicYearIn, db: Session = Depends(get_db)):
    return master_service.create_academic_year(db, payload.name)


@router.delete("/academic-years/{ay_id}", status_code=204)
def delete_academic_year(ay_id: int, db: Session = Depends(get_db)):
    master_service.delete_academic_year(db, ay_id)


# ── Semesters ──────────────────────────────────────────────────────────────────

@router.get("/semesters", response_model=list[SemesterOut])
def list_semesters(db: Session = Depends(get_db)):
    return master_service.list_semesters(db)


@router.post("/semesters", response_model=SemesterOut, status_code=201)
def create_semester(payload: SemesterIn, db: Session = Depends(get_db)):
    return master_service.create_semester(db, payload.name, payload.display_name)


@router.delete("/semesters/{sem_id}", status_code=204)
def delete_semester(sem_id: int, db: Session = Depends(get_db)):
    master_service.delete_semester(db, sem_id)
