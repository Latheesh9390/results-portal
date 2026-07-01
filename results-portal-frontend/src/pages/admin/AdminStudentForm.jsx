import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { createStudent, fetchStudentById, updateStudent } from "../../api/adminApi";

let rowKeyCounter = 0;
function blankRow() {
  return {
    _key: ++rowKeyCounter,
    subject_code: "",
    subject_name: "",
    internal_marks: "",
    external_marks: "",
    total_marks: "",
    result_status: "P",
    credits: "",
    grade: "",
  };
}

const emptyForm = {
  hallticket: "",
  student_name: "",
  branch: "",
  semester: "",
  exam_type: "regular",
  exam_title: "",
  sgpa: "",
  cgpa: "",
  total_credits: "",
  overall_result: "",
};

export default function AdminStudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([blankRow()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    fetchStudentById(id)
      .then((student) => {
        setForm({
          hallticket: student.hallticket,
          student_name: student.student_name,
          branch: student.branch,
          semester: student.semester,
          exam_type: student.exam_type,
          exam_title: student.exam_title,
          sgpa: student.sgpa ?? "",
          cgpa: student.cgpa ?? "",
          total_credits: student.total_credits ?? "",
          overall_result: student.overall_result ?? "",
        });
        setRows(
          student.results.length
            ? student.results.map((r) => ({
                _key: ++rowKeyCounter,
                subject_code: r.subject_code,
                subject_name: r.subject_name,
                internal_marks: r.internal_marks ?? "",
                external_marks: r.external_marks ?? "",
                total_marks: r.total_marks ?? "",
                result_status: r.result_status,
                credits: r.credits ?? "",
                grade: r.grade ?? "",
              }))
            : [blankRow()]
        );
      })
      .catch(() => setError("Could not load this record."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateRow(key, field, value) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, blankRow()]);
  }

  function removeRow(key) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r._key !== key) : rs));
  }

  function toNumberOrNull(v) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.hallticket.trim() || !form.student_name.trim()) {
      setError("Hall ticket and student name are required.");
      return;
    }
    const validRows = rows.filter((r) => r.subject_code.trim() && r.subject_name.trim());
    if (validRows.length === 0) {
      setError("Add at least one subject row with a code and name.");
      return;
    }

    const payload = {
      hallticket: form.hallticket.trim(),
      student_name: form.student_name.trim(),
      branch: form.branch.trim(),
      semester: form.semester.trim(),
      exam_type: form.exam_type,
      exam_title: form.exam_title.trim(),
      sgpa: form.sgpa.trim() || null,
      cgpa: form.cgpa.trim() || null,
      total_credits: form.total_credits.trim() || null,
      overall_result: form.overall_result.trim() || null,
      results: validRows.map((r) => ({
        subject_code: r.subject_code.trim(),
        subject_name: r.subject_name.trim(),
        internal_marks: toNumberOrNull(r.internal_marks),
        external_marks: toNumberOrNull(r.external_marks),
        total_marks: toNumberOrNull(r.total_marks),
        result_status: r.result_status,
        credits: toNumberOrNull(r.credits) ?? 0,
        grade: r.grade.trim() || null,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateStudent(id, payload);
      } else {
        await createStudent(payload);
      }
      navigate("/admin/students");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-gray-500">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-portal-navy mb-6">
        {isEdit ? "Edit Result" : "Add New Result"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h3 className="font-semibold text-portal-navy mb-4">Student Details</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Hall Ticket Number" required>
              <input
                value={form.hallticket}
                onChange={(e) => updateField("hallticket", e.target.value.toUpperCase())}
                className="input"
                required
              />
            </Field>
            <Field label="Student Name" required>
              <input
                value={form.student_name}
                onChange={(e) => updateField("student_name", e.target.value)}
                className="input"
                required
              />
            </Field>
            <Field label="Branch" required>
              <input
                value={form.branch}
                onChange={(e) => updateField("branch", e.target.value)}
                placeholder="e.g. CSE"
                className="input"
                required
              />
            </Field>
            <Field label="Semester" required>
              <input
                value={form.semester}
                onChange={(e) => updateField("semester", e.target.value)}
                placeholder="e.g. III-II"
                className="input"
                required
              />
            </Field>
            <Field label="Exam Type">
              <select
                value={form.exam_type}
                onChange={(e) => updateField("exam_type", e.target.value)}
                className="input"
              >
                <option value="regular">Regular</option>
                <option value="supplementary">Supplementary</option>
              </select>
            </Field>
            <Field label="Exam Title" required>
              <input
                value={form.exam_title}
                onChange={(e) => updateField("exam_title", e.target.value)}
                placeholder="e.g. B.Tech III Year II Semester (R23) Regular Examinations"
                className="input"
                required
              />
            </Field>
            <Field label="SGPA">
              <input
                value={form.sgpa}
                onChange={(e) => updateField("sgpa", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="CGPA">
              <input
                value={form.cgpa}
                onChange={(e) => updateField("cgpa", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Total Credits">
              <input
                value={form.total_credits}
                onChange={(e) => updateField("total_credits", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Overall Result (optional - auto-computed if left blank)">
              <select
                value={form.overall_result}
                onChange={(e) => updateField("overall_result", e.target.value)}
                className="input"
              >
                <option value="">Auto (PASS unless any subject fails)</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-portal-navy">Subject-wise Marks</h3>
            <button
              type="button"
              onClick={addRow}
              className="text-sm border border-portal-blue text-portal-blue hover:bg-portal-bg px-3 py-1.5 rounded transition-colors"
            >
              + Add Subject
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="py-1 pr-2">Code</th>
                  <th className="py-1 pr-2">Name</th>
                  <th className="py-1 pr-2 w-24">Internal</th>
                  <th className="py-1 pr-2 w-24">External</th>
                  <th className="py-1 pr-2 w-24">Total</th>
                  <th className="py-1 pr-2 w-20">Status</th>
                  <th className="py-1 pr-2 w-20">Credits</th>
                  <th className="py-1 pr-2 w-20">Grade</th>
                  <th className="py-1 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._key} className="border-t border-gray-100">
                    <td className="py-1.5 pr-2">
                      <input
                        value={row.subject_code}
                        onChange={(e) => updateRow(row._key, "subject_code", e.target.value)}
                        className="input"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={row.subject_name}
                        onChange={(e) => updateRow(row._key, "subject_name", e.target.value)}
                        className="input"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        value={row.internal_marks}
                        onChange={(e) => updateRow(row._key, "internal_marks", e.target.value)}
                        className="input"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        value={row.external_marks}
                        onChange={(e) => updateRow(row._key, "external_marks", e.target.value)}
                        className="input"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        value={row.total_marks}
                        onChange={(e) => updateRow(row._key, "total_marks", e.target.value)}
                        placeholder="auto"
                        className="input"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={row.result_status}
                        onChange={(e) => updateRow(row._key, "result_status", e.target.value)}
                        className="input"
                      >
                        <option value="P">P</option>
                        <option value="F">F</option>
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        step="0.5"
                        value={row.credits}
                        onChange={(e) => updateRow(row._key, "credits", e.target.value)}
                        className="input"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        value={row.grade}
                        onChange={(e) => updateRow(row._key, "grade", e.target.value)}
                        className="input"
                      />
                    </td>
                    <td className="py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row._key)}
                        disabled={rows.length === 1}
                        title="Remove row"
                        className="text-portal-fail disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <p className="text-portal-fail text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-portal-blue hover:bg-portal-navy text-white font-semibold px-6 py-2.5 rounded transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Result"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/students")}
            className="border border-gray-300 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label} {required && <span className="text-portal-fail">*</span>}
      </label>
      {children}
    </div>
  );
}
