from pydantic import BaseModel
from schemas.result import ResultIn, ResultOut


class StudentOut(BaseModel):
    hallticket: str
    student_name: str
    branch: str
    semester: str
    exam_type: str
    exam_title: str
    sgpa: str | None
    cgpa: str | None
    total_credits: str | None
    overall_result: str | None

    class Config:
        from_attributes = True


class MemoOut(StudentOut):
    """Full marks-memo payload returned to the frontend: student header + subject rows."""

    results: list[ResultOut]


# ---------------------------------------------------------------------------
# Admin-only schemas (creating/editing results from the dashboard)
# ---------------------------------------------------------------------------


class StudentIn(BaseModel):
    """Payload for POST/PUT from the admin "Add/Edit Result" form."""

    hallticket: str
    student_name: str
    branch: str
    semester: str
    exam_type: str = "regular"
    exam_title: str
    sgpa: str | None = None
    cgpa: str | None = None
    total_credits: str | None = None
    overall_result: str | None = None  # auto-computed from subject rows if omitted
    results: list[ResultIn] = []


class StudentAdminOut(MemoOut):
    """Same shape as MemoOut, plus the row id so the dashboard can edit/delete it."""

    id: int


class StudentListOut(BaseModel):
    """Lightweight row for the admin students table (no subject rows)."""

    id: int
    hallticket: str
    student_name: str
    branch: str
    semester: str
    exam_type: str
    overall_result: str | None

    class Config:
        from_attributes = True


class StudentPage(BaseModel):
    items: list[StudentListOut]
    total: int
    page: int
    page_size: int


class DashboardStats(BaseModel):
    total_students: int
    total_pass: int
    total_fail: int
    by_branch: dict[str, int]
    by_exam_type: dict[str, int]
