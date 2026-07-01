import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ResultPage from "./pages/ResultPage";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import ProtectedRoute from "./components/admin/ProtectedRoute";

// New workflow pages
import AdminMasterData from "./pages/admin/AdminMasterData";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminStudentManagement from "./pages/admin/AdminStudentManagement";
import AdminRegularResultEntry from "./pages/admin/AdminRegularResultEntry";
import AdminSupplementaryResultEntry from "./pages/admin/AdminSupplementaryResultEntry";
import AdminResultSearch from "./pages/admin/AdminResultSearch";

export default function App() {
  return (
    <Routes>
      {/* Public student-facing */}
      <Route path="/" element={<Home />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/contact" element={<Contact />} />

      {/* Admin auth */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />

      {/* Admin dashboard — all protected */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

      {/* Step 1: Master Data */}
      <Route path="/admin/master-data" element={<ProtectedRoute><AdminMasterData /></ProtectedRoute>} />

      {/* Step 2: Subject Management */}
      <Route path="/admin/subjects" element={<ProtectedRoute><AdminSubjects /></ProtectedRoute>} />

      {/* Step 3: Student Management */}
      <Route path="/admin/student-management" element={<ProtectedRoute><AdminStudentManagement /></ProtectedRoute>} />

      {/* Step 4: Regular Result Entry */}
      <Route path="/admin/regular-results" element={<ProtectedRoute><AdminRegularResultEntry /></ProtectedRoute>} />

      {/* Step 5: Supplementary Result Entry */}
      <Route path="/admin/supplementary-results" element={<ProtectedRoute><AdminSupplementaryResultEntry /></ProtectedRoute>} />

      {/* Reports */}
      <Route path="/admin/result-search" element={<ProtectedRoute><AdminResultSearch /></ProtectedRoute>} />

      {/* Account */}
      <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
