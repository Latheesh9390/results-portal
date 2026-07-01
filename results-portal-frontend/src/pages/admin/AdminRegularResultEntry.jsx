import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchBranches, fetchRegulations, fetchAcademicYears, fetchSemesters,
  fetchSubjectsForEntry, fetchStudentByHallticket,
  saveRegularResult, fetchRegularResultsByHallticket,
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

export default function AdminRegularResultEntry() {
  const [branches, setBranches] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [branch, setBranch] = useState("");
  const [regulation, setRegulation] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [examType, setExamType] = useState("regular");
  const [hallticket, setHallticket] = useState("");
  const [cgpa, setCgpa] = useState("");

  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState({}); // { subject_id: { internal, external } }
  const [existingResults, setExistingResults] = useState([]);

  const [step, setStep] = useState(1); // 1=select context, 2=enter hallticket, 3=enter marks
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchBranches().then(d => { setBranches(d); if (d.length) setBranch(d[0].name); });
    fetchRegulations().then(d => { setRegulations(d); if (d.length) setRegulation(d[0].name); });
    fetchAcademicYears().then(d => { setAcademicYears(d); if (d.length) setAcademicYear(d[d.length-1].name); });
    fetchSemesters().then(d => { setSemesters(d); if (d.length) setSemester(d[0].name); });
  }, []);

  const handleLoadSubjects = async () => {
    if (!branch || !regulation || !semester) { setErr("Please select all fields."); return; }
    setLoading(true); setErr(null);
    try {
      const subs = await fetchSubjectsForEntry(branch, regulation, semester);
      setSubjects(subs);
      const m = {};
      subs.forEach(s => { m[s.id] = { internal: "", external: "" }; });
      setMarks(m);
      setStep(2);
    } catch (e) {
      setErr(e?.response?.data?.detail || "No subjects found. Add subjects in Subject Management first.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadStudent = async () => {
    if (!hallticket.trim()) { setErr("Enter hall ticket number."); return; }
    setLoading(true); setErr(null);
    try {
      const s = await fetchStudentByHallticket(hallticket.trim());
      setStudent(s);
      // Load any existing results for this student
      const results = await fetchRegularResultsByHallticket(hallticket.trim());
      setExistingResults(results);
      // Pre-fill marks if result for this semester already exists
      const existing = results.find(r => r.semester === semester && r.exam_type === examType);
      if (existing) {
        const m = {};
        existing.entries.forEach(e => {
          if (e.subject_id) m[e.subject_id] = { internal: e.internal_marks ?? "", external: e.external_marks ?? "" };
        });
        setMarks(prev => ({ ...prev, ...m }));
        setCgpa(existing.cgpa || "");
      }
      setStep(3);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Student not found. Please add the student first.");
    } finally {
      setLoading(false);
    }
  };

  const setMark = (subId, field, value) => {
    setMarks(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value } }));
  };

  // Live preview calculations
  const preview = subjects.map(sub => {
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
  });

  const anyFail = preview.some(p => p.passed === false);
  const totalCredits = preview.reduce((s, p) => s + (p.creditsEarned || 0), 0);
  const sgpa = (() => {
    const total_gp = preview.reduce((s, p) => s + ((p.gp || 0) * (p.creditsEarned || 0)), 0);
    const total_c = preview.reduce((s, p) => s + (p.creditsEarned || 0), 0);
    return total_c > 0 ? (total_gp / total_c).toFixed(2) : "0.00";
  })();

  const handleSave = async () => {
    const entries = subjects.map(s => ({
      subject_id: s.id,
      internal_marks: marks[s.id]?.internal !== "" ? parseInt(marks[s.id]?.internal) : null,
      external_marks: marks[s.id]?.external !== "" ? parseInt(marks[s.id]?.external) : null,
    }));
    setSaving(true); setErr(null);
    try {
      await saveRegularResult({ hallticket: student.hallticket, academic_year: academicYear, regulation, semester, exam_type: examType, entries, cgpa: cgpa || null });
      setMsg("Result saved successfully!");
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to save result.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-portal-navy mb-6">Regular Result Entry</h2>

      {/* Step 1: Select context */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <h3 className="font-semibold text-portal-navy text-sm mb-3">Step 1: Select Exam Context</h3>
        <div className="grid sm:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Academic Year</label>
            <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue" value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
              {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Branch</label>
            <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue" value={branch} onChange={e => setBranch(e.target.value)}>
              {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Regulation</label>
            <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue" value={regulation} onChange={e => setRegulation(e.target.value)}>
              {regulations.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Semester</label>
            <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue" value={semester} onChange={e => setSemester(e.target.value)}>
              {semesters.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Exam Type</label>
            <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue" value={examType} onChange={e => setExamType(e.target.value)}>
              <option value="regular">Regular</option>
              <option value="lateral">Lateral Entry</option>
            </select>
          </div>
        </div>
        <button onClick={handleLoadSubjects} disabled={loading} className="mt-3 bg-portal-blue text-white text-sm font-semibold px-5 py-1.5 rounded hover:bg-portal-navy disabled:opacity-50 transition-colors">
          {loading ? "Loading..." : "Load Subjects →"}
        </button>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">{err}</div>}
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4 text-sm">{msg}</div>}

      {/* Step 2: Enter hall ticket */}
      {step >= 2 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
          <h3 className="font-semibold text-portal-navy text-sm mb-3">Step 2: Enter Hall Ticket</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1 max-w-xs">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Hall Ticket Number</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-portal-blue"
                value={hallticket}
                onChange={e => setHallticket(e.target.value.toUpperCase())}
                placeholder="e.g. 22KD1A0501"
                onKeyDown={e => e.key === "Enter" && handleLoadStudent()}
              />
            </div>
            <button onClick={handleLoadStudent} disabled={loading} className="bg-portal-blue text-white text-sm font-semibold px-5 py-1.5 rounded hover:bg-portal-navy disabled:opacity-50 transition-colors">
              {loading ? "..." : "Load Student →"}
            </button>
          </div>

          {step >= 3 && student && (
            <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded p-3">
              {student.photo && (
                <img src={student.photo} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-portal-blue" />
              )}
              <div>
                <p className="font-semibold text-portal-navy">{student.student_name}</p>
                <p className="text-xs text-gray-500">{student.hallticket} • {student.branch} • {student.regulation} • {student.batch}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Enter marks */}
      {step >= 3 && subjects.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-portal-navy text-sm">
              Step 3: Enter Marks — {branch} / {regulation} / Semester {semester}
            </span>
            <span className="text-xs text-gray-500">Internal: 0–30 | External: 0–70</span>
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
                <th className="px-3 py-2 text-center w-24">Credits Earned</th>
                <th className="px-3 py-2 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((sub) => (
                <tr key={sub.id} className={`border-t border-gray-100 ${sub.passed === false ? "bg-red-50" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-portal-navy">{sub.subject_name}</div>
                    <div className="text-xs text-gray-400">{sub.subject_code} • <span className={sub.subject_type === "Lab" ? "text-blue-500" : "text-gray-400"}>{sub.subject_type}</span></div>
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

          {/* Summary */}
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-6 flex-wrap">
                <div>
                  <span className="text-xs text-gray-500">SGPA (Preview)</span>
                  <div className="text-xl font-bold text-portal-navy">{sgpa}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Total Credits</span>
                  <div className="text-xl font-bold text-portal-navy">{totalCredits.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">CGPA (optional)</span>
                  <input
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-portal-blue block mt-1"
                    placeholder="CGPA"
                    value={cgpa}
                    onChange={e => setCgpa(e.target.value)}
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">Overall Result</span>
                  <div className={`text-xl font-bold ${anyFail ? "text-red-600" : "text-green-600"}`}>
                    {anyFail ? "FAIL" : "PASS"}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2 rounded transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "💾 Save Result"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Total, Grade, Grade Point, Credits Earned, SGPA, and Overall Result are auto-calculated. You only enter Internal and External marks.
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
