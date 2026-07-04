// app/admin/users/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/rbac/permissions";
import { AppShell } from "@/components/dashboard/app-shell";
import { Badge } from "@/components/ui/badge";
import { NewUserDialog } from "@/components/dashboard/new-user-dialog";

export default async function UsersPage() {
  const session = await getSession();

  // 1. Explicitly check session and roles to prevent the redirect loop
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN" && session.role !== "HOSPITAL_ADMIN") {
    redirect("/dashboard");
  }

  const where: Record<string, unknown> = { deletedAt: null };
  if (session.role !== "SUPER_ADMIN") where.hospitalId = session.hospitalId;

  const [users, hospitals] = await Promise.all([
    prisma.user.findMany({ where, include: { role: true, hospital: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    session.role === "SUPER_ADMIN" ? prisma.hospital.findMany({ select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  return (
    <AppShell active="users">
      {/* Outer viewport fluid layout buffers (px-4 on mobile, px-8 on desktops) */}
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Identity & access</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Users</h1>
          </div>
          <NewUserDialog isSuperAdmin={session.role === "SUPER_ADMIN"} hospitals={hospitals} />
        </div>

        {/* 📱 1. PREMIUM MOBILE ACCOUNT DIRECTORY CARDS (Rendered only on Mobile Viewports) */}
        <div className="grid gap-3 grid-cols-1 sm:hidden w-full">
          {users.map((u) => (
            <div key={u.id} className="rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim flex flex-col gap-2.5 shadow-panel">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-ink dark:text-white truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-ink-soft/80 dark:text-white/60 truncate mt-0.5">{u.email}</p>
                </div>
                <Badge tone="teal" className="shrink-0 text-[10px] tracking-tight">
                  {ROLE_LABELS[u.role.name]}
                </Badge>
              </div>

              {/* Display hospital tenant tag on mobile conditionally if user is a Super Admin */}
              {session.role === "SUPER_ADMIN" && u.hospital?.name && (
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

        {/* 🖥️ 2. STANDARD PERSISTENT DESKTOP DIRECTORY TABLE (Hidden on Mobile viewports entirely) */}
        <div className="hidden sm:block overflow-hidden rounded-md border border-ink/10 dark:border-white/10 bg-white dark:bg-paper-darkdim">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5 dark:text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                {session.role === "SUPER_ADMIN" && <th className="px-4 py-3 font-medium">Hospital</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 dark:divide-white/8">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-ink/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                  <td className="px-4 py-3"><Badge tone="teal">{ROLE_LABELS[u.role.name]}</Badge></td>
                  {session.role === "SUPER_ADMIN" && <td className="px-4 py-3 text-ink-soft">{u.hospital?.name ?? "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}