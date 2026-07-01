import { useLocation, Link } from "react-router-dom";

const GRADE_COLOR = {
  "S": "text-green-700 bg-green-50", "A+": "text-green-600 bg-green-50",
  "A": "text-blue-700 bg-blue-50", "B+": "text-blue-600 bg-blue-50",
  "B": "text-yellow-700 bg-yellow-50", "C": "text-orange-600 bg-orange-50",
  "F": "text-red-700 bg-red-50", "Ab": "text-gray-600 bg-gray-100",
};

export default function ResultPage() {
  const { state } = useLocation();
  const memo = state?.memo;

  if (!memo) {
    return (
      <div className="min-h-screen bg-portal-bg flex flex-col items-center justify-center p-6">
        <p className="text-gray-500 mb-4">No result data found.</p>
        <Link to="/" className="text-portal-blue underline">← Go Back</Link>
      </div>
    );
  }

  const results = memo.results || [];

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-portal-bg">
      <header className="bg-portal-navy text-white px-6 py-4 flex items-center justify-between print:hidden">
        <div>
          <p className="font-bold text-lg">JNTUA Results Portal</p>
          <p className="text-xs text-white/60">Jawaharlal Nehru Technological University Anantapur</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="text-sm border border-white/30 px-4 py-1.5 rounded hover:bg-white/10 transition-colors">
            🖨️ Print
          </button>
          <Link to="/" className="text-sm border border-white/30 px-4 py-1.5 rounded hover:bg-white/10 transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Student info card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6 flex items-center gap-6">
          {memo.photo ? (
            <img src={memo.photo} alt={memo.student_name} className="w-24 h-24 rounded-full object-cover border-4 border-portal-blue shadow" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400 border-4 border-dashed border-gray-300">👤</div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-portal-navy">{memo.student_name}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm">
              <div><span className="text-xs text-gray-400 block">Hall Ticket</span><span className="font-semibold font-mono">{memo.hallticket}</span></div>
              <div><span className="text-xs text-gray-400 block">Branch</span><span className="font-semibold">{memo.branch}</span></div>
              <div><span className="text-xs text-gray-400 block">Regulation</span><span className="font-semibold">{memo.regulation}</span></div>
              <div><span className="text-xs text-gray-400 block">Batch</span><span className="font-semibold">{memo.batch || "—"}</span></div>
            </div>
          </div>
        </div>

        {/* Result tables per semester */}
        {results.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
            No results available.
          </div>
        )}

        {results.map((r, idx) => (
          <div key={r.id || idx} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="font-bold text-portal-navy">Semester {r.semester}</span>
                <span className="text-gray-400 text-sm ml-3">{r.academic_year}</span>
                <span className="text-gray-400 text-sm ml-2">• {r.exam_type?.charAt(0).toUpperCase() + r.exam_type?.slice(1)}</span>
              </div>
              <span className={`text-sm font-bold px-4 py-1 rounded-full ${r.overall_result === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {r.overall_result}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-center">Internal</th>
                    <th className="px-4 py-3 text-center">External</th>
                    <th className="px-4 py-3 text-center">Total</th>
                    <th className="px-4 py-3 text-center">Grade</th>
                    <th className="px-4 py-3 text-center">Grade Point</th>
                    <th className="px-4 py-3 text-center">Credits</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {r.entries.map((e, i) => (
                    <tr key={i} className={`border-t border-gray-100 ${e.result_status === "FAIL" ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-portal-navy">{e.subject_name}</div>
                        <div className="text-xs text-gray-400">{e.subject_code}</div>
                      </td>
                      <td className="px-4 py-3 text-center">{e.internal_marks ?? "—"}</td>
                      <td className="px-4 py-3 text-center">{e.external_marks ?? "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold">{e.total_marks ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {e.grade ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${GRADE_COLOR[e.grade] || ""}`}>{e.grade}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">{e.grade_point ?? "—"}</td>
                      <td className="px-4 py-3 text-center">{e.credits_earned ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {e.result_status ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${e.result_status === "PASS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {e.result_status}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex gap-8 flex-wrap text-sm">
              <div><span className="text-xs text-gray-400 block">SGPA</span><span className="text-xl font-bold text-portal-navy">{r.sgpa || "—"}</span></div>
              <div><span className="text-xs text-gray-400 block">CGPA</span><span className="text-xl font-bold text-portal-navy">{r.cgpa || "—"}</span></div>
              <div><span className="text-xs text-gray-400 block">Total Credits</span><span className="text-xl font-bold text-portal-navy">{r.total_credits || "—"}</span></div>
              <div className="ml-auto flex items-end">
                <span className={`text-2xl font-black ${r.overall_result === "PASS" ? "text-green-600" : "text-red-600"}`}>{r.overall_result}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
