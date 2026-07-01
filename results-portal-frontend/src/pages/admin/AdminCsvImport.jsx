import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { importStudentsCsv } from "../../api/adminApi";

const CSV_TEMPLATE = `hallticket,student_name,branch,semester,exam_type,exam_title,subject_code,subject_name,internal_marks,external_marks,total_marks,result_status,credits,grade,sgpa,cgpa,total_credits,overall_result
23F41A0579,PANABAKULA LATHEESH,CSE,III-II,regular,B.Tech III Year II Semester (R23) Regular Examinations,23A31401T,Machine Learning,24,49,73,P,3,B,8.54,8.21,22.00,
23F41A0579,PANABAKULA LATHEESH,CSE,III-II,regular,B.Tech III Year II Semester (R23) Regular Examinations,23A05601T,Cryptography & Network Security,22,49,71,P,3,B,,,,
`;

export default function AdminCsvImport() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }
    setError(null);
    setResult(null);
    setUploading(true);
    try {
      const data = await importStudentsCsv(file);
      setResult(data);
      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-portal-navy mb-6">Bulk Import Results (CSV)</h2>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-portal-navy mb-2">How it works</h3>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
          <li>Each row in the CSV is one subject mark for one student.</li>
          <li>
            Multiple rows with the same <code className="bg-gray-100 px-1 rounded">hallticket</code> +{" "}
            <code className="bg-gray-100 px-1 rounded">exam_type</code> are grouped into a single
            student record with multiple subjects.
          </li>
          <li>
            If a hall ticket + exam type already exists, its result is <strong>replaced</strong>{" "}
            with what's in the file. Otherwise a new record is created.
          </li>
          <li>
            <code className="bg-gray-100 px-1 rounded">sgpa</code>,{" "}
            <code className="bg-gray-100 px-1 rounded">cgpa</code>,{" "}
            <code className="bg-gray-100 px-1 rounded">total_credits</code>, and{" "}
            <code className="bg-gray-100 px-1 rounded">overall_result</code> only need to be filled
            in on one row per student - leave them blank on the rest.
          </li>
          <li>
            <code className="bg-gray-100 px-1 rounded">total_marks</code> and{" "}
            <code className="bg-gray-100 px-1 rounded">overall_result</code> are auto-computed if
            left blank.
          </li>
        </ul>
        <button
          onClick={downloadTemplate}
          type="button"
          className="text-sm border border-portal-blue text-portal-blue hover:bg-portal-bg px-3 py-1.5 rounded transition-colors"
        >
          ⬇ Download CSV Template
        </button>
      </div>

      <form
        onSubmit={handleUpload}
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-portal-navy mb-2">
            Choose CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm"
          />
        </div>

        {error && (
          <p className="text-portal-fail text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        {result && (
          <p className="text-portal-pass text-sm bg-green-50 border border-green-200 rounded px-3 py-2">
            Import complete: {result.created} created, {result.updated} updated (
            {result.students_in_file} student record(s) in file).
          </p>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="bg-portal-blue hover:bg-portal-navy text-white font-semibold px-6 py-2.5 rounded transition-colors disabled:opacity-60"
        >
          {uploading ? "Importing…" : "Import CSV"}
        </button>
      </form>
    </AdminLayout>
  );
}
