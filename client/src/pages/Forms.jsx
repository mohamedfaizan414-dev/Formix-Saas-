import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { NewFormDialog } from "../components/dashboard/new-form-dialog";
import { FormRowActions } from "../components/dashboard/form-row-actions";
import { Badge } from "../components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FormsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);

  const fetchForms = React.useCallback(async () => {
    try {
      const res = await fetch("/api/forms");
      if (!res.ok) throw new Error("Failed to load forms");
      const data = await res.json();
      setForms(data.forms ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading forms list.");
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
      fetchForms();
    }
  }, [user, loading, navigate, fetchForms]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell active="forms">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 text-ink dark:text-white">
        <div className="mb-6 flex items-center justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Form management</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Forms</h1>
          </div>
          <NewFormDialog onSuccess={fetchForms} />
        </div>

        {/* 📱 1. MOBILE CARD LIST LOOK */}
        <div className="grid gap-3 grid-cols-1 sm:hidden w-full">
          {forms.map((f) => (
            <div key={f.id} className="rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim flex flex-col gap-3 shadow-panel">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link to={`/forms/${f.id}/builder`} className="font-display text-sm font-semibold text-clinical-teal hover:underline line-clamp-1">
                    {f.name}
                  </Link>
                  <Badge tone={f.status === "PUBLISHED" ? "sage" : f.status === "ARCHIVED" ? "neutral" : "amber"} className="shrink-0">
                    {f.status}
                  </Badge>
                </div>
                <p className="text-xs text-ink-soft/70 line-clamp-2 break-words">{f.description || "No description provided."}</p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-ink-soft/60 border-t border-ink/5 pt-2">
                <span>Version: <b className="text-ink dark:text-white font-bold">v{f.currentVersion}</b></span>
                <span>Updated: <b className="font-bold">{new Date(f.updatedAt).toLocaleDateString()}</b></span>
                {user.role === "SUPER_ADMIN" && f.hospital?.name && (
                  <span className="truncate max-w-full">Org: <b className="font-bold">{f.hospital.name}</b></span>
                )}
              </div>

              <div className="flex items-center justify-end border-t border-ink/5 pt-2 mt-0.5">
                <FormRowActions formId={f.id} status={f.status} onSuccess={fetchForms} />
              </div>
            </div>
          ))}
          {forms.length === 0 && (
            <p className="text-center py-10 text-xs text-ink-soft/60">No forms yet. Create your first one.</p>
          )}
        </div>

        {/* 🖥️ 2. FIXED PERSISTENT DESKTOP VIEW GRID TABLE */}
        <div className="hidden sm:block overflow-hidden rounded-md border border-ink/10 dark:border-white/10 bg-white dark:bg-paper-darkdim">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5 dark:text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium w-1/3 text-ink-soft">Name</th>
                {user.role === "SUPER_ADMIN" && <th className="px-4 py-3 font-medium w-1/4 text-ink-soft">Hospital</th>}
                <th className="px-4 py-3 font-medium w-24 text-ink-soft">Status</th>
                <th className="px-4 py-3 font-medium w-20 text-ink-soft">Version</th>
                <th className="px-4 py-3 font-medium w-28 text-ink-soft">Updated</th>
                <th className="px-4 py-3 font-medium text-right w-56 text-ink-soft" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 dark:divide-white/8">
              {forms.map((f) => (
                <tr key={f.id} className="hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 min-w-0">
                    <Link to={`/forms/${f.id}/builder`} className="font-medium text-clinical-teal hover:underline block truncate">{f.name}</Link>
                    <p className="mt-0.5 truncate text-xs text-ink-soft/60 max-w-xs">{f.description || "—"}</p>
                  </td>
                  {user.role === "SUPER_ADMIN" && (
                    <td className="px-4 py-3 text-ink-soft truncate max-w-[180px]">
                      {f.hospital?.name || "—"}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap"><Badge tone={f.status === "PUBLISHED" ? "sage" : f.status === "ARCHIVED" ? "neutral" : "amber"}>{f.status}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft whitespace-nowrap">v{f.currentVersion}</td>
                  <td className="px-4 py-3 text-xs text-ink-soft whitespace-nowrap">{new Date(f.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right align-middle">
                    <FormRowActions formId={f.id} status={f.status} onSuccess={fetchForms} />
                  </td>
                </tr>
              ))}
              {forms.length === 0 && (
                <tr>
                  <td colSpan={user.role === "SUPER_ADMIN" ? 6 : 5} className="px-4 py-10 text-center text-sm text-ink-soft/60">
                    No forms yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
