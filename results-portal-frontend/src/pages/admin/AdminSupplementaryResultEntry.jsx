import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchAcademicYears, fetchSemesters,
  fetchFailedSubjectsForSupply, saveSupplementaryResult,
  fetchStudentByHallticket,
} from "../../api/adminApi";

const GRADE_COLOR = {
  "S": "text-green-700 bg-green-50", "A+": "text-green-600 bg-green-50",
  "A": "text-blue-700 bg-blue-50", "B+": "text-blue-600 bg-blue-50",
  "B": "text-yellow-700 bg-yellow-50", "C": "text-orange-600 bg-orange-50",
  "F": "text-red-700 bg-red-50", "Ab": "text-gray-600 bg-gray-100",
};

function calcGrade(total, type) {
  if (total === null || total === undefined || total === "") return null;
  const t = parseInt(total);
  if (isNaN(t)) return null;
  const isLab = type?.toLowerCase() === "lab";
  if (isLab) {
    if (t >= 90) return { grade: "S", gp: 10 };
    if (t >= 80) return { grade: "A+", gp: 9 };
    if (t >= 70) return { grade: "A", gp: 8 };
    if (t >= 60) return { grade: "B+", gp: 7 };
    if (t >= 50) return { grade: "B", gp: 6 };
    return { grade: "F", gp: 0 };
  }
  if (t >= 90) return { grade: "S", gp: 10 };
  if (t >= 80) return { grade: "A+", gp: 9 };
  if (t >= 70) return { grade: "A", gp: 8 };
  if (t >= 60) return { grade: "B+", gp: 7 };
  if (t >= 50) return { grade: "B", gp: 6 };
  if (t >= 40) return { grade: "C", gp: 5 };
  return { grade: "F", gp: 0 };
}

function calcPass(internal, external, total, type) {
  if (total === null || total === undefined || total === "") return null;
  const t = parseInt(total);
  if (isNaN(t)) return null;
  const isLab = type?.toLowerCase() === "lab";
  if (isLab) return t >= 50;
  const i = parseInt(internal); const e = parseInt(external);
  return (isNaN(i) || i >= 12) && (isNaN(e) || e >= 28) && t >= 40;
}

export default function AdminSupplementaryResultEntry() {
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [hallticket, setHallticket] = useState("");

  const [student, setStudent] = useState(null);
  const [failedData, setFailedData] = useState(null); // { regular_result_id, failed_subjects, ... }
  const [marks, setMarks] = useState({}); // { entry_id: { internal, external } }

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    fetchAcademicYears().then(d => { setAcademicYears(d); if (d.length) setAcademicYear(d[d.length - 1].name); });
    fetchSemesters().then(d => { setSemesters(d); if (d.length) setSemester(d[0].name); });
  }, []);

  const handleLoadFailed = async () => {
    if (!hallticket.trim() || !semester) { setErr("Enter hall ticket and select semester."); return; }
    setLoading(true); setErr(null); setSaved(null);
    try {
      const [stu, failed] = await Promise.all([
        fetchStudentByHallticket(hallticket.trim()),
        fetchFailedSubjectsForSupply(hallticket.trim(), semester),
      ]);
      setStudent(stu);
      setFailedData(failed);
      const m = {};
      failed.failed_subjects.forEach(s => {
        m[s.id] = { internal: s.internal_marks ?? "", external: "" };
      });
      setMarks(m);
      setStep(2);
    } catch (e) {
      setErr(e?.response?.data?.detail || "No failed subjects found or student not found.");
    } finally {
      setLoading(false);
    }
  };

  const setMark = (id, field, value) => {
    setMarks(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const preview = failedData?.failed_subjects.map(sub => {
    const m = marks[sub.id] || {};
    const i = m.internal !== "" ? parseInt(m.internal) : null;
    const e = m.external !== "" ? parseInt(m.external) : null;
    const total = (i !== null && e !== null) ? i + e : null;
    const gradeInfo = total !== null ? calcGrade(total, sub.subject_type) : null;
    const passed = total !== null ? calcPass(i, e, total, sub.subject_type) : null;
    return {
      ...sub,
      internal: i, external: e, total,
      grade: gradeInfo?.grade ?? null,
      gp: gradeInfo?.gp ?? null,
      passed,
      creditsEarned: passed ? sub.credits : 0,
    };
  }) || [];

  const handleSave = async () => {
    const entries = failedData.failed_subjects.map(s => ({
      regular_entry_id: s.id,
      internal_marks: marks[s.id]?.internal !== "" ? parseInt(marks[s.id]?.internal) : null,
      external_marks: marks[s.id]?.external !== "" ? parseInt(marks[s.id]?.external) : null,
    }));
    setSaving(true); setErr(null);
    try {
      const result = await saveSupplementaryResult({
        hallticket: student.hallticket,
        academic_year: academicYear,
        regulation: failedData.regulation,
        semester,
        regular_result_id: failedData.regular_result_id,
        entries,
      });
      setSaved(result);
      setMsg("Supplementary result saved! Original result updated.");
      setTimeout(() => setMsg(null), 4000);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to save result.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-portal-navy mb-2">Supplementary Result Entry</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter the hall ticket — the portal automatically loads only the failed subjects from the
        regular result. Admin only enters marks for those subjects.
      </p>

      {/* Step 1 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h3 className="font-semibold text-portal-navy text-sm mb-3">Step 1: Identify Student & Semester</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Supply Exam Year</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
              value={academicYear} onChange={e => setAcademicYear(e.target.value)}
            >
              {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Semester</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
              value={semester} onChange={e => setSemester(e.target.value)}
            >
              {semesters.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Hall Ticket</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-portal-blue"
              value={hallticket}
              onChange={e => setHallticket(e.target.value.toUpperCase())}
              placeholder="e.g. 22KD1A0501"
              onKeyDown={e => e.key === "Enter" && handleLoadFailed()}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleLoadFailed}
              disabled={loading}
              className="w-full bg-portal-blue text-white text-sm font-semibold px-4 py-1.5 rounded hover:bg-portal-navy disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "Load Failed Subjects →"}
            </button>
          </div>
        </div>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">{err}</div>}
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4 text-sm">{msg}</div>}

      {/* Step 2: Enter marks for failed subjects only */}
      {step >= 2 && failedData && (
        <>
          {/* Student info */}
          {student && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded p-3 mb-4">
              {student.photo && (
                <img src={student.photo} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-portal-blue" />
              )}
              <div>
                <p className="font-semibold text-portal-navy">{student.student_name}</p>
                <p className="text-xs text-gray-500">{student.hallticket} • {student.branch} • {student.regulation} • Semester {semester}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full">
                  {failedData.failed_subjects.length} Failed Subject(s)
                </span>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <span className="font-semibold text-portal-navy text-sm">
                Step 2: Enter Marks for Failed Subjects Only
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                Original internal marks shown as reference. Enter new external marks. Portal auto-calculates everything else.
              </p>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <tr>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-center w-24">Credits</th>
                  <th className="px-3 py-2 text-center w-28">Internal<br/><span className="text-gray-400 normal-case font-normal">(0–30)</span></th>
                  <th className="px-3 py-2 text-center w-28">External<br/><span className="text-gray-400 normal-case font-normal">(0–70)</span></th>
                  <th className="px-3 py-2 text-center w-20">Total</th>
                  <th className="px-3 py-2 text-center w-20">Grade</th>
                  <th className="px-3 py-2 text-center w-20">GP</th>
                  <th className="px-3 py-2 text-center w-28">Credits Earned</th>
                  <th className="px-3 py-2 text-center w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(sub => (
                  <tr key={sub.id} className={`border-t border-gray-100 ${sub.passed === false ? "bg-red-50" : sub.passed === true ? "bg-green-50" : ""}`}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-portal-navy">{sub.subject_name}</div>
                      <div className="text-xs text-gray-400">{sub.subject_code} • {sub.subject_type}</div>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{sub.credits}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number" min="0" max="30"
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                        value={marks[sub.id]?.internal ?? ""}
                        onChange={e => setMark(sub.id, "internal", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number" min="0" max="70"
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                        value={marks[sub.id]?.external ?? ""}
                        onChange={e => setMark(sub.id, "external", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center font-semibold">{sub.total ?? "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {sub.grade ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLOR[sub.grade] || ""}`}>{sub.grade}</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{sub.gp ?? "—"}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{sub.passed !== null ? sub.creditsEarned : "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {sub.passed !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${sub.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {sub.passed ? "PASS" : "FAIL"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-gray-500">
                On save: passed subjects update the original regular result.
                SGPA, total credits, and overall result recalculate automatically.
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2 rounded transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save Supplementary Result"}
              </button>
            </div>
          </div>

          {/* Post-save summary */}
          {saved && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-5">
              <h4 className="font-bold text-green-800 mb-2">✅ Result Saved</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-500">Updated SGPA</span>
                  <div className="text-2xl font-bold text-portal-navy">{saved.sgpa}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Total Credits</span>
                  <div className="text-2xl font-bold text-portal-navy">{saved.total_credits}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Final Overall Result</span>
                  <div className={`text-2xl font-bold ${saved.overall_result === "PASS" ? "text-green-700" : "text-red-600"}`}>
                    {saved.overall_result}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
