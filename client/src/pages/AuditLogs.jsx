import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { Badge } from "../components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      setFetching(true);
      fetch("/api/audit-logs")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load audit logs");
          return res.json();
        })
        .then((data) => {
          setLogs(data.logs ?? []);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error loading audit logs.");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [user, loading, navigate]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell active="audit">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 text-ink dark:text-white">
        <p className="stamp text-xs text-clinical-sage">Compliance</p>
        <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Audit logs</h1>
        <p className="mt-1 text-xs sm:text-sm text-ink-soft/70">Every form, submission, and auth event, timestamped and attributable.</p>

        {/* 📱 1. PREMIUM MOBILE COMPLIANCE CARDS */}
        <div className="grid gap-3 grid-cols-1 sm:hidden w-full mt-6">
          {logs.map((log) => (
            <div key={log.id} className="rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim flex flex-col gap-2.5 shadow-panel text-xs font-sans">
              <div className="flex items-center justify-between gap-2 border-b border-ink/5 pb-2">
                <Badge tone="teal" className="text-[10px] tracking-tight">{log.action}</Badge>
                <span className="text-[11px] font-mono text-ink-soft/60">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="space-y-1 font-mono text-[11px] text-ink-soft/80">
                <p className="truncate">
                  Target: <span className="text-ink dark:text-white font-medium">{log.entityType}{log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}</span>
                </p>
                <p className="truncate">
                  User: <span className="text-ink dark:text-white font-medium">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "—"}</span>
                </p>
                <p className="text-[10px] text-ink-soft/50 font-sans mt-1">
                  Logged: {new Date(log.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center py-10 text-xs text-ink-soft/60">No compliance logs captured yet.</p>
          )}
        </div>

        {/* 🖥️ 2. ORIGINAL STABLE DESKTOP TABLE STRUCTURE */}
        <div className="hidden sm:block mt-6 overflow-hidden rounded-md border border-ink/10 dark:border-white/10 bg-white dark:bg-paper-darkdim">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5 dark:text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium text-ink-soft">Action</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Entity</th>
                <th className="px-4 py-3 font-medium text-ink-soft">User</th>
                <th className="px-4 py-3 font-medium text-ink-soft">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 dark:divide-white/8">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-ink/[0.01] transition-colors">
                  <td className="px-4 py-2.5"><Badge tone="teal">{log.action}</Badge></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-soft">{log.entityType}{log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-soft/60">
                    No activity yet.
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
