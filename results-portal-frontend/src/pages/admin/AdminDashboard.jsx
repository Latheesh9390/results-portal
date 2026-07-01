import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchBranches, fetchRegulations, fetchSemesters, fetchStudents } from "../../api/adminApi";

function StatCard({ label, value, accent, bg, to }) {
  const inner = (
    <div className={`border border-gray-200 rounded-lg shadow-sm p-5 ${bg || "bg-white"} ${to ? "hover:shadow-md transition-shadow" : ""}`}>
      <p className="text-xs uppercase text-gray-500 font-semibold">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent || "text-portal-navy"}`}>{value}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickCard({ emoji, title, desc, to, color }) {
  return (
    <Link to={to} className={`${color || "bg-white"} border border-gray-200 rounded-lg p-4 hover:shadow transition-shadow group block`}>
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="font-semibold text-portal-navy group-hover:text-portal-blue text-sm">{title}</div>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ branches: 0, regulations: 0, semesters: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchBranches().catch(() => []),
      fetchRegulations().catch(() => []),
      fetchSemesters().catch(() => []),
      fetchStudents({ page: 1, page_size: 1 }).catch(() => ({ total: 0 })),
    ]).then(([branches, regulations, semesters, studentData]) => {
      setStats({ branches: branches.length, regulations: regulations.length, semesters: semesters.length, students: studentData.total || 0 });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-portal-navy">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Results Portal Admin Panel</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold text-portal-navy mb-2">Admin Workflow</p>
        <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
          <Link to="/admin/master-data" className="bg-white border border-blue-200 rounded px-2 py-1 hover:bg-blue-100">1. Master Data</Link>
          <span className="text-gray-400">→</span>
          <Link to="/admin/subjects" className="bg-white border border-blue-200 rounded px-2 py-1 hover:bg-blue-100">2. Subjects</Link>
          <span className="text-gray-400">→</span>
          <Link to="/admin/student-management" className="bg-white border border-blue-200 rounded px-2 py-1 hover:bg-blue-100">3. Students</Link>
          <span className="text-gray-400">→</span>
          <Link to="/admin/regular-results" className="bg-white border border-blue-200 rounded px-2 py-1 hover:bg-blue-100">4. Regular Results</Link>
          <span className="text-gray-400">→</span>
          <Link to="/admin/supplementary-results" className="bg-white border border-blue-200 rounded px-2 py-1 hover:bg-blue-100">5. Supplementary Results</Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Branches" value={loading ? "—" : stats.branches} to="/admin/master-data" />
        <StatCard label="Regulations" value={loading ? "—" : stats.regulations} to="/admin/master-data" />
        <StatCard label="Semesters" value={loading ? "—" : stats.semesters} to="/admin/master-data" />
        <StatCard label="Students" value={loading ? "—" : stats.students} accent="text-portal-blue" to="/admin/student-management" />
      </div>

      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickCard emoji="🗂️" title="Master Data" desc="Add branches, regulations, academic years, semesters — create once." to="/admin/master-data" color="bg-gray-50" />
        <QuickCard emoji="📚" title="Subject Management" desc="Add subjects per branch/regulation/semester. Auto-loads during result entry." to="/admin/subjects" color="bg-blue-50" />
        <QuickCard emoji="👤" title="Student Management" desc="Register students with hall ticket, branch, regulation, batch, and photo." to="/admin/student-management" color="bg-indigo-50" />
        <QuickCard emoji="📝" title="Regular Result Entry" desc="Select context → enter hall ticket → enter marks. Everything else auto-calculated." to="/admin/regular-results" color="bg-green-50" />
        <QuickCard emoji="🔁" title="Supplementary Results" desc="Enter hall ticket → sees only failed subjects → enter marks → updates original." to="/admin/supplementary-results" color="bg-orange-50" />
        <QuickCard emoji="🔍" title="Result Search" desc="Search any student result by hall ticket number." to="/admin/result-search" color="bg-purple-50" />
      </div>
    </AdminLayout>
  );
}
