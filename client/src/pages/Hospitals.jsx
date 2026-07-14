import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { Badge } from "../components/ui/badge";
import { HospitalToggle } from "../components/dashboard/hospital-toggle";
import { NewHospitalDialog } from "../components/dashboard/new-hospital-dialog";
import { DeleteHospitalDialog } from "../components/dashboard/delete-hospital-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function HospitalsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);

  const fetchHospitals = React.useCallback(async () => {
    try {
      const res = await fetch("/api/hospitals");
      if (!res.ok) throw new Error("Failed to load hospitals");
      const data = await res.json();
      setHospitals(data.hospitals ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading hospitals directory.");
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
      if (user.role !== "SUPER_ADMIN") {
        navigate("/dashboard");
        return;
      }
      fetchHospitals();
    }
  }, [user, loading, navigate, fetchHospitals]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!user || user.role !== "SUPER_ADMIN") return null;

  return (
    <AppShell active="hospitals">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 text-ink dark:text-white">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Multi-tenant management</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Hospitals</h1>
          </div>
          <div className="w-full sm:w-auto shrink-0 flex">
            <NewHospitalDialog onSuccess={fetchHospitals} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {hospitals.map((h) => (
            <div key={h.id} className="rounded-md border border-ink/10 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-paper-darkdim flex flex-col justify-between shadow-panel gap-3 font-sans">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <p className="font-display text-sm font-semibold text-ink dark:text-white truncate max-w-[180px] sm:max-w-none">
                    {h.name}
                  </p>
                  <Badge tone={h.isActive ? "sage" : "brick"} className="shrink-0 text-[10px]">
                    {h.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[11px] text-ink-soft/60 truncate">{h.slug}</p>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-ink-soft border-t border-ink/5 pt-3 w-full min-h-[36px]">
                <span className="font-medium">{h._count?.forms ?? 0} forms · {h._count?.users ?? 0} users</span>
                <div className="flex items-center gap-2">
                  <HospitalToggle hospitalId={h.id} isActive={h.isActive} onSuccess={fetchHospitals} />
                  <DeleteHospitalDialog hospitalId={h.id} hospitalName={h.name} onSuccess={fetchHospitals} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
