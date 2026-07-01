/**
 * AdminQuickAdd.jsx
 * Quick-add page: admin enters a hall ticket number and all details get filled
 * in. Supports updating marks for existing students too.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchStudentByHallticket, createStudent, updateStudent } from "../../api/adminApi";

let rowKeyCounter = 0;
function blankRow(subjectCode = "", subjectName = "") {
  return {
    _key: ++rowKeyCounter,
    subject_code: subjectCode,
    subject_name: subjectName,
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

export default function AdminQuickAdd() {
  const navigate = useNavigate();

  const [hallticketInput, setHallticketInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [existingId, setExistingId] = useState(null); // if student already exists

  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([blankRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  async function handleHallticketLookup(e) {
    e.preventDefault();
    const ht = hallticketInput.trim().toUpperCase();
    if (!ht) { setError("Please enter a hall ticket number."); return; }
    setError(null);
    setSuccess(null);
    setLookingUp(true);
    try {
      const student = await fetchStudentByHallticket(ht);
      // Student found — pre-fill for editing
      setExistingId(student.id);
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
      setSuccess(`✅ Existing record found for ${ht}. Edit the marks below and save.`);
    } catch (err) {
      if (err.status === 404) {
        // New student — just set the hallticket
        setExistingId(null);
        setForm({ ...emptyForm, hallticket: ht });
        setRows([blankRow()]);
        setSuccess(`✅ No existing record for ${ht}. Fill in details below to add a new result.`);
      } else {
        setError("Could not look up hall ticket. Please try again.");
      }
    } finally {
      setLookingUp(false);
      setLookupDone(true);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      hallticket: form.hallticket.trim().toUpperCase(),
      student_name: form.student_name.trim(),
      branch: form.branch.trim().toUpperCase(),
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
      if (existingId) {
        await updateStudent(existingId, payload);
        setSuccess(`✅ Result for ${payload.hallticket} updated successfully!`);
      } else {
        await createStudent(payload);
        setSuccess(`✅ Result for ${payload.hallticket} added successfully!`);
      }
      // Reset for next entry
      setHallticketInput("");
      setLookupDone(false);
      setExistingId(null);
      setForm(emptyForm);
      setRows([blankRow()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-portal-navy">Quick Add / Update Result</h2>
        <span className="text-sm text-gray-500">Enter hall ticket → auto-loads existing data if found</span>
      </div>

      {/* Step 1: Hall ticket lookup */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-portal-navy mb-3">Step 1 — Enter Hall Ticket Number</h3>
        <form onSubmit={handleHallticketLookup} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Hall Ticket Number</label>
            <input
              type="text"
              value={hallticketInput}
              onChange={(e) => setHallticketInput(e.target.value.toUpperCase())}
              placeholder="e.g. 23F41A0579"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-portal-accent"
              maxLength={15}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Exam Type</label>
            <select
              value={form.exam_type}
              onChange={(e) => updateField("exam_type", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
            >
              <option value="regular">Regular</option>
              <option value="supplementary">Supplementary</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={lookingUp}
            className="bg-portal-navy hover:bg-portal-blue text-white font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-60"
          >
            {lookingUp ? "Looking up…" : "Lookup / Check"}
          </button>
        </form>
      </div>

      {/* Feedback banners */}
      {error && (
        <p className="text-portal-fail text-sm bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">
          {success}
        </p>
      )}

      {/* Step 2: fill in / edit details */}
      {lookupDone && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-portal-navy">
                Step 2 — {existingId ? "Update" : "Enter"} Student Details
              </h3>
              {existingId && (
                <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-0.5 font-medium">
                  Updating existing record
                </span>
              )}
              {!existingId && (
                <span className="text-xs bg-green-100 text-green-800 border border-green-300 rounded px-2 py-0.5 font-medium">
                  Adding new record
                </span>
              )}
            </div>
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
              <Field label="Exam Title" required>
                <input
                  value={form.exam_title}
                  onChange={(e) => updateField("exam_title", e.target.value)}
                  placeholder="e.g. B.Tech III Year II Sem (R23) Regular"
                  className="input"
                  required
                />
              </Field>
              <Field label="SGPA">
                <input value={form.sgpa} onChange={(e) => updateField("sgpa", e.target.value)} className="input" />
              </Field>
              <Field label="CGPA">
                <input value={form.cgpa} onChange={(e) => updateField("cgpa", e.target.value)} className="input" />
              </Field>
              <Field label="Total Credits">
                <input value={form.total_credits} onChange={(e) => updateField("total_credits", e.target.value)} className="input" />
              </Field>
              <Field label="Overall Result">
                <select value={form.overall_result} onChange={(e) => updateField("overall_result", e.target.value)} className="input">
                  <option value="">Auto (PASS unless any subject fails)</option>
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Subject rows */}
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
                  <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50">
                    <th className="py-2 px-2">Code</th>
                    <th className="py-2 px-2">Subject Name</th>
                    <th className="py-2 px-2 w-20">Internal</th>
                    <th className="py-2 px-2 w-20">External</th>
                    <th className="py-2 px-2 w-20">Total</th>
                    <th className="py-2 px-2 w-20">Status</th>
                    <th className="py-2 px-2 w-20">Credits</th>
                    <th className="py-2 px-2 w-16">Grade</th>
                    <th className="py-2 px-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._key} className="border-t border-gray-100">
                      <td className="py-1.5 px-2">
                        <input value={row.subject_code} onChange={(e) => updateRow(row._key, "subject_code", e.target.value)} className="input" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input value={row.subject_name} onChange={(e) => updateRow(row._key, "subject_name", e.target.value)} className="input" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" value={row.internal_marks} onChange={(e) => updateRow(row._key, "internal_marks", e.target.value)} className="input" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" value={row.external_marks} onChange={(e) => updateRow(row._key, "external_marks", e.target.value)} className="input" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" value={row.total_marks} onChange={(e) => updateRow(row._key, "total_marks", e.target.value)} placeholder="auto" className="input" />
                      </td>
                      <td className="py-1.5 px-2">
                        <select value={row.result_status} onChange={(e) => updateRow(row._key, "result_status", e.target.value)} className="input">
                          <option value="P">P (Pass)</option>
                          <option value="F">F (Fail)</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" step="0.5" value={row.credits} onChange={(e) => updateRow(row._key, "credits", e.target.value)} className="input" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input value={row.grade} onChange={(e) => updateRow(row._key, "grade", e.target.value)} className="input" />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button type="button" onClick={() => removeRow(row._key)} disabled={rows.length === 1} title="Remove" className="text-portal-fail disabled:opacity-30 text-lg leading-none">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-portal-blue hover:bg-portal-navy text-white font-semibold px-6 py-2.5 rounded transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : existingId ? "Update Result" : "Save Result"}
            </button>
            <button
              type="button"
              onClick={() => { setLookupDone(false); setHallticketInput(""); setForm(emptyForm); setRows([blankRow()]); setExistingId(null); setError(null); setSuccess(null); }}
              className="border border-gray-300 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded transition-colors"
            >
              Clear / New Entry
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className="border border-gray-300 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded transition-colors"
            >
              View All Results
            </button>
          </div>
        </form>
      )}
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
