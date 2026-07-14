import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { PatientsTableList } from "../components/dashboard/patients-table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PatientsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [fetching, setFetching] = React.useState(true);

  const fetchPatients = React.useCallback(async () => {
    try {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to load patients");
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error(err);
      toast.error("Error loading patients directory.");
    } finally {
      setFetching(false);
    }
  }, []);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchPatients();
    }
  }, [user, loading, navigate, fetchPatients]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!user || !data) return null;

  return (
    <AppShell active="patients">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 text-ink dark:text-white">
        <div className="mb-6 flex items-center justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Identity & Access</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Patients</h1>
          </div>
        </div>

        <PatientsTableList 
          initialPatients={data.patients} 
          isSuperAdmin={user.role === "SUPER_ADMIN"}
          hospitals={data.hospitals}
          organizationId={user.hospitalId}
          onSuccess={fetchPatients}
        />
      </div>
    </AppShell>
  );
}
