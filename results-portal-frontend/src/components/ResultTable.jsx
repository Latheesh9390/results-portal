export default function ResultTable({ results }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-portal-bg text-portal-navy text-left">
            <th className="px-3 py-2 font-semibold">Subject Code</th>
            <th className="px-3 py-2 font-semibold">Subject Name</th>
            <th className="px-3 py-2 font-semibold text-center">Internal Marks</th>
            <th className="px-3 py-2 font-semibold text-center">External Marks</th>
            <th className="px-3 py-2 font-semibold text-center">Total Marks</th>
            <th className="px-3 py-2 font-semibold text-center">Result Status</th>
            <th className="px-3 py-2 font-semibold text-center">Credits</th>
            <th className="px-3 py-2 font-semibold text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row, idx) => (
            <tr
              key={row.subject_code}
              className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-3 py-2 whitespace-nowrap">{row.subject_code}</td>
              <td className="px-3 py-2">{row.subject_name}</td>
              <td className="px-3 py-2 text-center">{row.internal_marks ?? "-"}</td>
              <td className="px-3 py-2 text-center">{row.external_marks ?? "-"}</td>
              <td className="px-3 py-2 text-center font-medium">{row.total_marks ?? "-"}</td>
              <td className="px-3 py-2 text-center">
                <span
                  className={
                    row.result_status === "P"
                      ? "text-portal-pass font-semibold"
                      : "text-portal-fail font-semibold"
                  }
                >
                  {row.result_status}
                </span>
              </td>
              <td className="px-3 py-2 text-center">{row.credits.toFixed(2)}</td>
              <td className="px-3 py-2 text-center font-semibold">{row.grade ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
