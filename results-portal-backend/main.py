"""Results Portal API — full workflow with master data, subjects, students, results."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import Base, SessionLocal, engine
import models  # registers all mapped classes
from models.admin import Admin
from auth import hash_password
from routers import auth as auth_router
from routers import results as results_router
from routers import master as master_router
from routers import subjects as subjects_router
from routers import students as students_router
from routers import regular_results as regular_results_router
from routers import supplementary_results as supplementary_results_router

# Create/migrate tables
Base.metadata.create_all(bind=engine)


def _ensure_default_admin():
    db = SessionLocal()
    try:
        if db.query(Admin).count() == 0:
            db.add(Admin(username="admin", hashed_password=hash_password("admin123")))
            db.commit()
            print('Created default admin -> username: "admin", password: "admin123"')
    finally:
        db.close()


_ensure_default_admin()

app = FastAPI(
    title="Results Portal API",
    description="JNTUA-style Results Portal with full workflow.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public student-facing routes
app.include_router(results_router.router, prefix="/api", tags=["results"])

# Admin auth
app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])

# Admin-protected routes
app.include_router(master_router.router, prefix="/api/admin", tags=["master-data"])
app.include_router(subjects_router.router, prefix="/api/admin", tags=["subjects"])
app.include_router(students_router.router, prefix="/api/admin", tags=["students"])
app.include_router(regular_results_router.router, prefix="/api/admin", tags=["regular-results"])
app.include_router(supplementary_results_router.router, prefix="/api/admin", tags=["supplementary-results"])

# Serve uploaded photos from static/
os.makedirs("static/photos", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return {"status": "ok", "service": "results-portal-api", "version": "2.0.0"}
