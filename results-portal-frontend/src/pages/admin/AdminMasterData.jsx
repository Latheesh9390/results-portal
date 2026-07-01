import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchBranches, createBranch, deleteBranch,
  fetchRegulations, createRegulation, deleteRegulation,
  fetchAcademicYears, createAcademicYear, deleteAcademicYear,
  fetchSemesters, createSemester, deleteSemester,
} from "../../api/adminApi";

const DEFAULT_BRANCHES = ["CSE", "ECE", "EEE", "MECH", "CIVIL"];
const DEFAULT_REGULATIONS = ["R20", "R23"];
const DEFAULT_ACADEMIC_YEARS = ["2023-24", "2024-25", "2025-26"];
const DEFAULT_SEMESTERS = [
  { name: "1-1", display_name: "I Year I Semester" },
  { name: "1-2", display_name: "I Year II Semester" },
  { name: "2-1", display_name: "II Year I Semester" },
  { name: "2-2", display_name: "II Year II Semester" },
  { name: "3-1", display_name: "III Year I Semester" },
  { name: "3-2", display_name: "III Year II Semester" },
  { name: "4-1", display_name: "IV Year I Semester" },
  { name: "4-2", display_name: "IV Year II Semester" },
];

function Section({ title, items, onAdd, onDelete, addPlaceholder, addLabel, children }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await onAdd(input.trim());
    setInput("");
    setLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="font-bold text-portal-navy mb-3">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input
          className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-portal-blue"
          placeholder={addPlaceholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        {children}
        <button
          onClick={handleAdd}
          disabled={loading || !input.trim()}
          className="bg-portal-blue text-white text-sm px-4 py-1.5 rounded hover:bg-portal-navy disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : addLabel || "Add"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
            <span className="font-medium text-portal-navy">{item.name || item.display_name}</span>
            {item.display_name && item.name !== item.display_name && (
              <span className="text-gray-400 text-xs">({item.display_name})</span>
            )}
            <button
              onClick={() => onDelete(item.id)}
              className="ml-1 text-gray-400 hover:text-red-500 font-bold leading-none"
              title="Delete"
            >×</button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-400 text-sm italic">None added yet.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminMasterData() {
  const [branches, setBranches] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadAll = () => {
    fetchBranches().then(setBranches).catch(() => {});
    fetchRegulations().then(setRegulations).catch(() => {});
    fetchAcademicYears().then(setAcademicYears).catch(() => {});
    fetchSemesters().then(setSemesters).catch(() => {});
  };

  useEffect(() => { loadAll(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(null), 3000); };

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      for (const b of DEFAULT_BRANCHES) await createBranch({ name: b }).catch(() => {});
      for (const r of DEFAULT_REGULATIONS) await createRegulation({ name: r }).catch(() => {});
      for (const y of DEFAULT_ACADEMIC_YEARS) await createAcademicYear({ name: y }).catch(() => {});
      for (const s of DEFAULT_SEMESTERS) await createSemester(s).catch(() => {});
      loadAll();
      flash("Default master data seeded successfully!");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-portal-navy">Master Data</h2>
          <p className="text-sm text-gray-500 mt-1">Create these once — they are reused everywhere.</p>
        </div>
        <button
          onClick={seedDefaults}
          disabled={seeding}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
        >
          {seeding ? "Seeding..." : "⚡ Seed Defaults"}
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4 text-sm">
          {msg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <Section
          title="Branches"
          items={branches}
          onAdd={async (name) => { await createBranch({ name }); loadAll(); flash(`Branch "${name}" added.`); }}
          onDelete={async (id) => { await deleteBranch(id); loadAll(); }}
          addPlaceholder="e.g. CSE"
          addLabel="Add Branch"
        />
        <Section
          title="Regulations"
          items={regulations}
          onAdd={async (name) => { await createRegulation({ name }); loadAll(); flash(`Regulation "${name}" added.`); }}
          onDelete={async (id) => { await deleteRegulation(id); loadAll(); }}
          addPlaceholder="e.g. R23"
          addLabel="Add Regulation"
        />
        <Section
          title="Academic Years"
          items={academicYears}
          onAdd={async (name) => { await createAcademicYear({ name }); loadAll(); flash(`Academic Year "${name}" added.`); }}
          onDelete={async (id) => { await deleteAcademicYear(id); loadAll(); }}
          addPlaceholder="e.g. 2025-26"
          addLabel="Add Year"
        />
        <Section
          title="Semesters"
          items={semesters}
          onAdd={async (name) => { await createSemester({ name }); loadAll(); flash(`Semester "${name}" added.`); }}
          onDelete={async (id) => { await deleteSemester(id); loadAll(); }}
          addPlaceholder="e.g. 3-1"
          addLabel="Add Semester"
        />
      </div>
    </AdminLayout>
  );
}
