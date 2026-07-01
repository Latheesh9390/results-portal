import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const navItems = [
  { to: "/admin", label: "📊 Dashboard", end: true },
  { label: "── Master Data", header: true },
  { to: "/admin/master-data", label: "🗂️ Branches / Regulations / Years", end: true },
  { to: "/admin/subjects", label: "📚 Subject Management", end: true },
  { label: "── Students & Results", header: true },
  { to: "/admin/student-management", label: "👤 Student Management", end: true },
  { to: "/admin/regular-results", label: "📝 Regular Result Entry", end: true },
  { to: "/admin/supplementary-results", label: "🔁 Supplementary Results", end: true },
  { label: "── Reports", header: true },
  { to: "/admin/result-search", label: "🔍 Result Search", end: true },
  { label: "── Account", header: true },
  { to: "/admin/settings", label: "⚙️ Settings", end: true },
];

export default function AdminLayout({ children }) {
  const { username, logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-portal-bg">
      <aside className="w-64 shrink-0 bg-portal-navy text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="font-bold leading-tight text-base">JNTUA Results Portal</p>
          <p className="text-xs text-white/60 mt-0.5">Admin Dashboard</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 text-sm overflow-y-auto">
          {navItems.map((item, i) =>
            item.header ? (
              <p key={i} className="text-white/30 text-xs px-3 pt-3 pb-1 uppercase tracking-widest">
                {item.label.replace("── ", "")}
              </p>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded transition-colors ${
                    isActive
                      ? "bg-white/15 font-semibold text-white"
                      : "hover:bg-white/5 text-white/80 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            🌐 View Public Site ↗
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h1 className="text-portal-navy font-semibold text-base">Results Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Signed in as <span className="font-semibold text-portal-navy">{username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 px-6 py-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
