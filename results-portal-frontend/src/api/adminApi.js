import api from "./axios";

// ── Master Data ──────────────────────────────────────────────────────────────

export const fetchBranches = () => api.get("/api/admin/branches").then(r => r.data);
export const createBranch = (data) => api.post("/api/admin/branches", data).then(r => r.data);
export const deleteBranch = (id) => api.delete(`/api/admin/branches/${id}`);

export const fetchRegulations = () => api.get("/api/admin/regulations").then(r => r.data);
export const createRegulation = (data) => api.post("/api/admin/regulations", data).then(r => r.data);
export const deleteRegulation = (id) => api.delete(`/api/admin/regulations/${id}`);

export const fetchAcademicYears = () => api.get("/api/admin/academic-years").then(r => r.data);
export const createAcademicYear = (data) => api.post("/api/admin/academic-years", data).then(r => r.data);
export const deleteAcademicYear = (id) => api.delete(`/api/admin/academic-years/${id}`);

export const fetchSemesters = () => api.get("/api/admin/semesters").then(r => r.data);
export const createSemester = (data) => api.post("/api/admin/semesters", data).then(r => r.data);
export const deleteSemester = (id) => api.delete(`/api/admin/semesters/${id}`);

// ── Subjects ─────────────────────────────────────────────────────────────────

export const fetchSubjects = (branch, regulation, semester) =>
  api.get("/api/admin/subjects", { params: { branch, regulation, semester } }).then(r => r.data);

export const createSubject = (data) => api.post("/api/admin/subjects", data).then(r => r.data);
export const updateSubject = (id, data) => api.put(`/api/admin/subjects/${id}`, data).then(r => r.data);
export const deleteSubject = (id) => api.delete(`/api/admin/subjects/${id}`);
export const bulkCreateSubjects = (data) => api.post("/api/admin/subjects/bulk", data).then(r => r.data);

// ── Students ─────────────────────────────────────────────────────────────────

export const fetchStudents = (params) => api.get("/api/admin/students", { params }).then(r => r.data);
export const fetchStudentById = (id) => api.get(`/api/admin/students/${id}`).then(r => r.data);
export const fetchStudentByHallticket = (hallticket) =>
  api.get("/api/admin/students/by-hallticket", { params: { hallticket } }).then(r => r.data);
export const createStudent = (data) => api.post("/api/admin/students", data).then(r => r.data);
export const updateStudent = (id, data) => api.put(`/api/admin/students/${id}`, data).then(r => r.data);
export const deleteStudent = (id) => api.delete(`/api/admin/students/${id}`);

// ── Regular Results ───────────────────────────────────────────────────────────

export const fetchSubjectsForEntry = (branch, regulation, semester) =>
  api.get("/api/admin/subjects-for-entry", { params: { branch, regulation, semester } }).then(r => r.data);

export const saveRegularResult = (data) => api.post("/api/admin/regular-results", data).then(r => r.data);
export const fetchRegularResultsByHallticket = (hallticket) =>
  api.get("/api/admin/regular-results/by-hallticket", { params: { hallticket } }).then(r => r.data);
export const fetchRegularResultById = (id) =>
  api.get(`/api/admin/regular-results/${id}`).then(r => r.data);
export const deleteRegularResult = (id) => api.delete(`/api/admin/regular-results/${id}`);
export const fetchFailedSubjects = (result_id) =>
  api.get(`/api/admin/regular-results/${result_id}/failed-subjects`).then(r => r.data);

// ── Supplementary Results ─────────────────────────────────────────────────────

export const fetchFailedSubjectsForSupply = (hallticket, semester) =>
  api.get("/api/admin/supplementary-results/failed-subjects", { params: { hallticket, semester } }).then(r => r.data);
export const saveSupplementaryResult = (data) =>
  api.post("/api/admin/supplementary-results", data).then(r => r.data);

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export const fetchDashboardStats = () => api.get("/api/admin/stats").then(r => r.data);

// ── Change Password ───────────────────────────────────────────────────────────

export const changePassword = (data) => api.post("/api/admin/change-password", data).then(r => r.data);

// ── Auth (used by AdminAuthContext) ───────────────────────────────────────────

export const adminLogin = (data) => api.post("/api/auth/login", data).then(r => r.data);
export const adminRegister = (data) => api.post("/api/auth/register", data).then(r => r.data);

// ── Legacy aliases (keep old pages compilable) ────────────────────────────────
export const fetchStudent = (id) => fetchStudentById(id);
export const importStudentsCsv = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/api/admin/students/import-csv", fd).then(r => r.data);
};
