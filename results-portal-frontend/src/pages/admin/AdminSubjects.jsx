import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchBranches, fetchRegulations, fetchSemesters,
  fetchSubjects, createSubject, deleteSubject,
} from "../../api/adminApi";

const EMPTY = { subject_code: "", subject_name: "", credits: "", subject_type: "Theory" };

export default function AdminSubjects() {
  const [branches, setBranches] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [branch, setBranch] = useState("");
  const [regulation, setRegulation] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchBranches().then(d => { setBranches(d); if (d.length) setBranch(d[0].name); });
    fetchRegulations().then(d => { setRegulations(d); if (d.length) setRegulation(d[0].name); });
    fetchSemesters().then(d => { setSemesters(d); if (d.length) setSemester(d[0].name); });
  }, []);

  const loadSubjects = async () => {
    if (!branch || !regulation || !semester) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchSubjects(branch, regulation, semester);
      setSubjects(data);
      setLoaded(true);
    } catch {
      setErr("Could not load subjects.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.subject_code || !form.subject_name || !form.credits) {
      setErr("Please fill all subject fields.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await createSubject({
        branch, regulation, semester,
        subject_code: form.subject_code.trim(),
        subject_name: form.subject_name.trim(),
        credits: parseFloat(form.credits),
        subject_type: form.subject_type,
      });
      setForm(EMPTY);
      await loadSubjects();
      setMsg("Subject added.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to add subject.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this subject?")) return;
    await deleteSubject(id).catch(() => {});
    await loadSubjects();
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-portal-navy mb-6">Subject Management</h2>

      {/* Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <p className="text-sm text-gray-500 mb-3">
          Select Branch, Regulation & Semester to manage subjects. Subjects entered here are
          automatically loaded during result entry — you never re-enter them.
        </p>
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Branch</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
              value={branch} onChange={e => setBranch(e.target.value)}
            >
              {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Regulation</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
              value={regulation} onChange={e => setRegulation(e.target.value)}
            >
              {regulations.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Semester</label>
            <select
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
              value={semester} onChange={e => setSemester(e.target.value)}
            >
              {semesters.map(s => <option key={s.id} value={s.name}>{s.name} {s.display_name ? `(${s.display_name})` : ""}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadSubjects}
              className="w-full bg-portal-blue text-white text-sm font-semibold px-4 py-1.5 rounded hover:bg-portal-navy transition-colors"
            >
              Load Subjects
            </button>
          </div>
        </div>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">{err}</div>}
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4 text-sm">{msg}</div>}

      {loaded && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-portal-navy text-sm">
              Subjects for {branch} / {regulation} / Semester {semester}
            </span>
            <span className="text-xs text-gray-500">{subjects.length} subject(s)</span>
          </div>

          {subjects.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Subject Name</th>
                  <th className="px-4 py-2 text-center">Credits</th>
                  <th className="px-4 py-2 text-center">Type</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{s.subject_code}</td>
                    <td className="px-4 py-2">{s.subject_name}</td>
                    <td className="px-4 py-2 text-center">{s.credits}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.subject_type === "Lab" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {s.subject_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add subject form */}
          <div className="border-t border-gray-200 p-4 bg-blue-50">
            <p className="text-xs font-semibold text-gray-600 mb-2">Add New Subject</p>
            <div className="grid sm:grid-cols-5 gap-2">
              <input
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                placeholder="Subject Code"
                value={form.subject_code}
                onChange={e => setForm(f => ({ ...f, subject_code: e.target.value }))}
              />
              <input
                className="border border-gray-300 rounded px-2 py-1.5 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-portal-blue"
                placeholder="Subject Name"
                value={form.subject_name}
                onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))}
              />
              <input
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                placeholder="Credits (e.g. 4)"
                type="number"
                step="0.5"
                value={form.credits}
                onChange={e => setForm(f => ({ ...f, credits: e.target.value }))}
              />
              <select
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                value={form.subject_type}
                onChange={e => setForm(f => ({ ...f, subject_type: e.target.value }))}
              >
                <option value="Theory">Theory</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="mt-2 bg-portal-blue text-white text-sm font-semibold px-5 py-1.5 rounded hover:bg-portal-navy disabled:opacity-50 transition-colors"
            >
              {loading ? "Adding..." : "+ Add Subject"}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
