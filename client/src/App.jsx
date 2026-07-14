import * as React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Import pages
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import FormsPage from "./pages/Forms";
import FormBuilderPage from "./pages/FormBuilder";
import SubmissionsPage from "./pages/Submissions";
import SubmissionViewPage from "./pages/SubmissionView";
import VersionsPage from "./pages/Versions";
import PatientsPage from "./pages/Patients";
import PatientDetailPage from "./pages/PatientDetail";
import HospitalsPage from "./pages/Hospitals";
import UsersPage from "./pages/Users";
import AuditLogsPage from "./pages/AuditLogs";
import FillFormPage from "./pages/FillForm";
import PreviewPage from "./pages/FormPreview";
import PublicFormFillPage from "./pages/PublicFormFill";

import { Toaster } from "sonner";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/fill/:id" element={<FillFormPage />} />
          <Route path="/forms/:id/preview" element={<PreviewPage />} />
          <Route path="/public-forms/:token" element={<PublicFormFillPage />} />

          {/* Authenticated dashboard routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/forms/:id/builder" element={<FormBuilderPage />} />
          <Route path="/forms/:id/submissions" element={<SubmissionsPage />} />
          <Route path="/forms/:id/submissions/:subId" element={<SubmissionViewPage />} />
          <Route path="/forms/:id/versions" element={<VersionsPage />} />
          <Route path="/dashboard/patients" element={<PatientsPage />} />
          <Route path="/dashboard/patients/:id" element={<PatientDetailPage />} />

          {/* Admin routes */}
          <Route path="/admin/hospitals" element={<HospitalsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
