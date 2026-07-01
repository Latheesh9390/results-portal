import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchStudents, createStudent, updateStudent, deleteStudent,
  fetchBranches, fetchRegulations,
} from "../../api/adminApi";

const EMPTY = { hallticket: "", student_name: "", branch: "", regulation: "", batch: "", photo: null };

function PhotoPicker({ value, onChange }) {
  const inputRef = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="photo" className="w-16 h-16 object-cover rounded-full border-2 border-portal-blue" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl border-2 border-dashed border-gray-300">
          👤
        </div>
      )}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border border-gray-300"
        >
          {value ? "Change Photo" : "Upload Photo"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="ml-2 text-xs text-red-500 hover:underline">
            Remove
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

function StudentModal({ student, branches, regulations, onClose, onSave }) {
  const isEdit = !!student?.id;
  const [form, setForm] = useState(student || EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const handle = async () => {
    if (!form.hallticket || !form.student_name || !form.branch) {
      setErr("Hall Ticket, Name, and Branch are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      if (isEdit) {
        await updateStudent(student.id, form);
      } else {
        await createStudent(form);
      }
      onSave();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to save student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-portal-navy">{isEdit ? "Edit Student" : "Add Student"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <PhotoPicker value={form.photo} onChange={v => setForm(f => ({ ...f, photo: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Hall Ticket Number *</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-portal-blue"
                value={form.hallticket}
                onChange={e => setForm(f => ({ ...f, hallticket: e.target.value.toUpperCase() }))}
                disabled={isEdit}
                placeholder="e.g. 22KD1A0501"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Student Name *</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                value={form.student_name}
                onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Branch *</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                value={form.branch}
                onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
              >
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Regulation</label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                value={form.regulation}
                onChange={e => setForm(f => ({ ...f, regulation: e.target.value }))}
              >
                <option value="">Select Regulation</option>
                {regulations.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Batch</label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-portal-blue"
                value={form.batch}
                onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
                placeholder="e.g. 2022-2026"
              />
            </div>
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-portal-blue text-white font-semibold rounded hover:bg-portal-navy disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Add Student"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStudentManagement() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | student_obj
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches().then(setBranches);
    fetchRegulations().then(setRegulations);
  }, []);

  const load = async (p = page, s = search) => {
    setLoading(true);
    try {
      const data = await fetchStudents({ page: p, page_size: 20, search: s || undefined });
      setStudents(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, search); }, [search]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete student "${name}"? This also removes all their results.`)) return;
    await deleteStudent(id).catch(() => {});
    load();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-portal-navy">Student Management</h2>
          <p className="text-sm text-gray-500 mt-1">{total} student(s) registered</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="bg-portal-blue text-white text-sm font-semibold px-4 py-2 rounded hover:bg-portal-navy transition-colors"
        >
          + Add Student
        </button>
      </div>

      <div className="mb-4">
        <input
          className="border border-gray-300 rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-portal-blue"
          placeholder="Search by name or hall ticket..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No students found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="px-4 py-3 text-left">Hall Ticket</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th className="px-4 py-3 text-left">Regulation</th>
                <th className="px-4 py-3 text-left">Batch</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-portal-navy">{s.hallticket}</td>
                  <td className="px-4 py-3">{s.student_name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{s.branch}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.regulation}</td>
                  <td className="px-4 py-3 text-gray-500">{s.batch}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setModal(s)}
                      className="text-portal-blue hover:underline text-xs mr-3"
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(s.id, s.student_name)}
                      className="text-red-500 hover:underline text-xs"
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => { setPage(p); load(p); }}
              className={`w-8 h-8 text-sm rounded ${p === page ? "bg-portal-blue text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <StudentModal
          student={modal === "add" ? null : modal}
          branches={branches}
          regulations={regulations}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </AdminLayout>
  );
}
