import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { deleteStudent, fetchStudents } from "../../api/adminApi";

const PAGE_SIZE = 15;

export default function AdminStudentList() {
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("");
  const [overallResult, setOverallResult] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStudents({
        search, examType, overallResult, page, pageSize: PAGE_SIZE,
      });
      setData(result);
    } catch {
      setError("Could not load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, examType, overallResult]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDelete(student) {
    if (!window.confirm(`Delete result for ${student.hallticket} (${student.student_name})?`)) return;
    setDeletingId(student.id);
    try {
      await deleteStudent(student.id);
      await load();
    } catch {
      setError("Could not delete this record. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-portal-navy">Manage Results</h2>
        <div className="flex gap-2">
          <Link
            to="/admin/quick-add"
            className="bg-portal-blue hover:bg-portal-navy text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
          >
            ⚡ Quick Add / Update
          </Link>
          <Link
            to="/admin/students/new"
            className="border border-portal-blue text-portal-blue hover:bg-portal-bg text-sm font-semibold px-4 py-2 rounded transition-colors"
          >
            + Full Form Add
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Search hall ticket / name</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. 23F41A0579 or student name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Exam Type</label>
          <select value={examType} onChange={(e) => { setExamType(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent">
            <option value="">All</option>
            <option value="regular">Regular</option>
            <option value="supplementary">Supplementary</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Result</label>
          <select value={overallResult} onChange={(e) => { setOverallResult(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-portal-accent">
            <option value="">All</option>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
          </select>
        </div>
        <button type="submit" className="bg-portal-navy text-white text-sm font-semibold px-4 py-2 rounded hover:bg-portal-blue transition-colors">
          Search
        </button>
      </form>

      {error && (
        <p className="text-portal-fail text-sm bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-portal-bg text-portal-navy text-left">
              <th className="px-4 py-2 font-semibold">Hall Ticket</th>
              <th className="px-4 py-2 font-semibold">Name</th>
              <th className="px-4 py-2 font-semibold">Branch</th>
              <th className="px-4 py-2 font-semibold">Semester</th>
              <th className="px-4 py-2 font-semibold">Exam Type</th>
              <th className="px-4 py-2 font-semibold">SGPA</th>
              <th className="px-4 py-2 font-semibold text-center">Result</th>
              <th className="px-4 py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No results found.</td></tr>
            ) : (
              data.items.map((student, idx) => (
                <tr key={student.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 font-medium font-mono">{student.hallticket}</td>
                  <td className="px-4 py-2">{student.student_name}</td>
                  <td className="px-4 py-2">{student.branch}</td>
                  <td className="px-4 py-2">{student.semester}</td>
                  <td className="px-4 py-2 capitalize">{student.exam_type}</td>
                  <td className="px-4 py-2">{student.sgpa ?? "–"}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={student.overall_result === "PASS" ? "text-portal-pass font-semibold" : "text-portal-fail font-semibold"}>
                      {student.overall_result ?? "–"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right space-x-3 whitespace-nowrap">
                    <Link
                      to={`/admin/students/${student.id}/edit`}
                      className="text-portal-blue hover:underline font-medium"
                    >
                      ✏️ Edit Marks
                    </Link>
                    <button
                      onClick={() => handleDelete(student)}
                      disabled={deletingId === student.id}
                      className="text-portal-fail hover:underline font-medium disabled:opacity-50"
                    >
                      {deletingId === student.id ? "Deleting…" : "🗑 Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && data.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Showing page {data.page} of {totalPages} ({data.total} total records)</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="border border-gray-300 rounded px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50">
              ← Previous
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="border border-gray-300 rounded px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50">
              Next →
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
