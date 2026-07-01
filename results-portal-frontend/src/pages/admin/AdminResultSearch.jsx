import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";

const GRADE_COLOR = {
  "S": "text-green-700 bg-green-50", "A+": "text-green-600 bg-green-50",
  "A": "text-blue-700 bg-blue-50", "B+": "text-blue-600 bg-blue-50",
  "B": "text-yellow-700 bg-yellow-50", "C": "text-orange-600 bg-orange-50",
  "F": "text-red-700 bg-red-50", "Ab": "text-gray-600 bg-gray-100",
};

export default function AdminResultSearch() {
  const [hallticket, setHallticket] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleSearch = async () => {
    if (!hallticket.trim()) return;
    setLoading(true); setErr(null); setResult(null);
    try {
      const res = await api.get(`/api/results/${hallticket.trim()}?exam=regular`);
      setResult(res.data);
      setActiveTab(0);
    } catch (e) {
      setErr(e?.response?.data?.detail || "No result found.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-portal-navy mb-6">Result Search</h2>

      <div className="flex gap-3 mb-6">
        <input
          className="border border-gray-300 rounded px-3 py-2 text-sm w-72 uppercase focus:outline-none focus:ring-2 focus:ring-portal-blue"
          placeholder="Enter Hall Ticket Number..."
          value={hallticket}
          onChange={e => setHallticket(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-portal-blue text-white text-sm font-semibold px-5 py-2 rounded hover:bg-portal-navy disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
        {result && (
          <button onClick={handlePrint} className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded hover:bg-gray-50">
            🖨️ Print
          </button>
        )}
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm">{err}</div>}

      {result && (
        <div>
          {/* Student header */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4 flex items-center gap-4">
            {result.photo ? (
              <img src={result.photo} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-portal-blue" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-3xl">👤</div>
            )}
            <div>
              <h3 className="text-lg font-bold text-portal-navy">{result.student_name}</h3>
              <p className="text-sm text-gray-500">{result.hallticket} • {result.branch} • {result.regulation} • Batch: {result.batch}</p>
            </div>
          </div>

          {/* Tabs for multiple semesters */}
          {result.results?.length > 1 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {result.results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActiveTab(i)}
                  className={`text-sm px-3 py-1.5 rounded border transition-colors ${activeTab === i ? "bg-portal-blue text-white border-portal-blue" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
                >
                  Sem {r.semester} ({r.academic_year})
                </button>
              ))}
            </div>
          )}

          {result.results?.length > 0 && (() => {
            const r = result.results[activeTab] || result.results[0];
            return (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-semibold text-portal-navy">Semester {r.semester}</span>
                    <span className="text-gray-400 text-sm ml-3">{r.academic_year} • {r.exam_type}</span>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${r.overall_result === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {r.overall_result}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Subject</th>
                      <th className="px-4 py-2 text-center">Internal</th>
                      <th className="px-4 py-2 text-center">External</th>
                      <th className="px-4 py-2 text-center">Total</th>
                      <th className="px-4 py-2 text-center">Grade</th>
                      <th className="px-4 py-2 text-center">GP</th>
                      <th className="px-4 py-2 text-center">Credits</th>
                      <th className="px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.entries.map((e, i) => (
                      <tr key={i} className={`border-t border-gray-100 ${e.result_status === "FAIL" ? "bg-red-50" : ""}`}>
                        <td className="px-4 py-2">
                          <div className="font-medium text-portal-navy">{e.subject_name}</div>
                          <div className="text-xs text-gray-400">{e.subject_code}</div>
                        </td>
                        <td className="px-4 py-2 text-center">{e.internal_marks}</td>
                        <td className="px-4 py-2 text-center">{e.external_marks}</td>
                        <td className="px-4 py-2 text-center font-semibold">{e.total_marks}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLOR[e.grade] || ""}`}>{e.grade}</span>
                        </td>
                        <td className="px-4 py-2 text-center">{e.grade_point}</td>
                        <td className="px-4 py-2 text-center">{e.credits_earned}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${e.result_status === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {e.result_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-4 border-t bg-gray-50 flex gap-8">
                  <div><span className="text-xs text-gray-500">SGPA</span><div className="text-xl font-bold text-portal-navy">{r.sgpa}</div></div>
                  <div><span className="text-xs text-gray-500">CGPA</span><div className="text-xl font-bold text-portal-navy">{r.cgpa || "—"}</div></div>
                  <div><span className="text-xs text-gray-500">Total Credits</span><div className="text-xl font-bold text-portal-navy">{r.total_credits}</div></div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </AdminLayout>
  );
}
