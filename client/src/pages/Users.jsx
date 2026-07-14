import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../lib/rbac/permissions";
import { AppShell } from "../components/dashboard/app-shell";
import { Badge } from "../components/ui/badge";
import { NewUserDialog } from "../components/dashboard/new-user-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = React.useState([]);
  const [hospitals, setHospitals] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);

  const fetchUsersAndHospitals = React.useCallback(async () => {
    try {
      const usersRes = await fetch("/api/users");
      if (!usersRes.ok) throw new Error("Failed to load users");
      const usersData = await usersRes.json();
      setUsers(usersData.users ?? []);

      if (user && user.role === "SUPER_ADMIN") {
        const hospRes = await fetch("/api/hospitals");
        if (hospRes.ok) {
          const hospData = await hospRes.json();
          setHospitals(hospData.hospitals ?? []);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading users directory.");
    } finally {
      setFetching(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      if (user.role !== "SUPER_ADMIN" && user.role !== "HOSPITAL_ADMIN") {
        navigate("/dashboard");
        return;
      }
      fetchUsersAndHospitals();
    }
  }, [user, loading, navigate, fetchUsersAndHospitals]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "HOSPITAL_ADMIN")) return null;

  return (
    <AppShell active="users">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 text-ink dark:text-white">
        <div className="mb-6 flex items-center justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Identity & access</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Users</h1>
          </div>
          <NewUserDialog isSuperAdmin={user.role === "SUPER_ADMIN"} hospitals={hospitals} onSuccess={fetchUsersAndHospitals} />
        </div>

        {/* 📱 1. PREMIUM MOBILE ACCOUNT DIRECTORY CARDS */}
        <div className="grid gap-3 grid-cols-1 sm:hidden w-full">
          {users.map((u) => (
            <div key={u.id} className="rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim flex flex-col gap-2.5 shadow-panel font-sans">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-ink dark:text-white truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-ink-soft/80 dark:text-white/60 truncate mt-0.5">{u.email}</p>
                </div>
                <Badge tone="teal" className="shrink-0 text-[10px] tracking-tight font-sans">
                  {ROLE_LABELS[u.role.name]}
                </Badge>
              </div>

              {user.role === "SUPER_ADMIN" && u.hospital?.name && (
                <div className="border-t border-ink/5 pt-2 mt-0.5 flex items-center justify-between text-[11px] font-mono text-ink-soft/60">
                  <span>Organization tenant:</span>
                  <span className="font-sans font-medium text-ink dark:text-white truncate max-w-[160px]">
                    {u.hospital.name}
                  </span>
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-center py-10 text-xs text-ink-soft/60">No matching user accounts discovered.</p>
          )}
        </div>

        {/* 🖥️ 2. STANDARD PERSISTENT DESKTOP DIRECTORY TABLE */}
        <div className="hidden sm:block overflow-hidden rounded-md border border-ink/10 dark:border-white/10 bg-white dark:bg-paper-darkdim">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5 dark:text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium text-ink-soft">Name</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Email</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Role</th>
                {user.role === "SUPER_ADMIN" && <th className="px-4 py-3 font-medium text-ink-soft">Hospital</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 dark:divide-white/8">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-ink/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                  <td className="px-4 py-3"><Badge tone="teal">{ROLE_LABELS[u.role.name]}</Badge></td>
                  {user.role === "SUPER_ADMIN" && <td className="px-4 py-3 text-ink-soft">{u.hospital?.name ?? "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
