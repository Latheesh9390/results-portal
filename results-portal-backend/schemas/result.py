from pydantic import BaseModel


class ResultOut(BaseModel):
    subject_code: str
    subject_name: str
    internal_marks: int | None
    external_marks: int | None
    total_marks: int | None
    result_status: str
    credits: float
    grade: str | None

    class Config:
        from_attributes = True


class ResultIn(BaseModel):
    """One subject row, as submitted by the admin "Add/Edit Result" form."""

    subject_code: str
    subject_name: str
    internal_marks: int | None = None
    external_marks: int | None = None
    total_marks: int | None = None  # auto-computed from internal+external if omitted
    result_status: str = "P"  # P | F
    credits: float = 0
    grade: str | None = None
