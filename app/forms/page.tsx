// app/forms/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { AppShell } from "@/components/dashboard/app-shell";
import { NewFormDialog } from "@/components/dashboard/new-form-dialog";
import { FormRowActions } from "@/components/dashboard/form-row-actions";
import { Badge } from "@/components/ui/badge";

export default async function FormsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const where: Record<string, unknown> = { deletedAt: null };
  if (session.role !== "SUPER_ADMIN") where.hospitalId = session.hospitalId;

  const forms = await prisma.form.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { hospital: { select: { name: true } }, createdBy: { select: { firstName: true, lastName: true } } },
  });

  const canManage = roleHasPermission(session.role, "form.create");

  return (
    <AppShell active="forms">
      {/* Dynamic responsive outer padding layout constraints */}
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Form management</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Forms</h1>
          </div>
          {canManage && <NewFormDialog />}
        </div>

        {/* 📱 1. PREMIUM MOBILE CARD LIST LOOK (Rendered only on Mobile Viewports) */}
        <div className="grid gap-3 grid-cols-1 sm:hidden w-full">
          {forms.map((f) => (
            <div key={f.id} className="rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim flex flex-col gap-3 shadow-panel">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link href={`/forms/${f.id}/builder`} className="font-display text-sm font-semibold text-clinical-teal hover:underline line-clamp-1">
                    {f.name}
                  </Link>
                  <Badge tone={f.status === "PUBLISHED" ? "sage" : f.status === "ARCHIVED" ? "neutral" : "amber"} className="shrink-0">
                    {f.status}
                  </Badge>
                </div>
                <p className="text-xs text-ink-soft/70 line-clamp-2 break-words">{f.description || "No description provided."}</p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-ink-soft/60 border-t border-ink/5 pt-2">
                <span>Version: <b className="text-ink dark:text-white">v{f.currentVersion}</b></span>
                <span>Updated: <b>{new Date(f.updatedAt).toLocaleDateString()}</b></span>
                {session.role === "SUPER_ADMIN" && f.hospital?.name && (
                  <span className="truncate max-w-full">Org: <b>{f.hospital.name}</b></span>
                )}
              </div>

              {canManage && (
                <div className="flex items-center justify-end border-t border-ink/5 pt-2 mt-0.5">
                  <FormRowActions formId={f.id} status={f.status} />
                </div>
              )}
            </div>
          ))}
          {forms.length === 0 && (
            <p className="text-center py-10 text-xs text-ink-soft/60">No forms yet. Create your first one.</p>
          )}
        </div>

        {/* 🖥️ 2. STANDARD PERSISTENT DESKTOP VIEW GRID TABLE (Hidden on Mobile viewports) */}
        <div className="hidden sm:block overflow-hidden rounded-md border border-ink/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5 dark:text-white/40">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                {session.role === "SUPER_ADMIN" && <th className="px-4 py-3 font-medium">Hospital</th>}
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 dark:divide-white/8">
              {forms.map((f) => (
                <tr key={f.id} className="hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/forms/${f.id}/builder`} className="font-medium text-clinical-teal hover:underline">{f.name}</Link>
                    <p className="mt-0.5 truncate text-xs text-ink-soft/60">{f.description}</p>
                  </td>
                  {session.role === "SUPER_ADMIN" && <td className="px-4 py-3 text-ink-soft">{f.hospital?.name}</td>}
                  <td className="px-4 py-3"><Badge tone={f.status === "PUBLISHED" ? "sage" : f.status === "ARCHIVED" ? "neutral" : "amber"}>{f.status}</Badge></td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">v{f.currentVersion}</td>
                  <td className="px-4 py-3 text-xs text-ink-soft">{new Date(f.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{canManage && <FormRowActions formId={f.id} status={f.status} />}</td>
                </tr>
              ))}
              {forms.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-soft/60">No forms yet. Create your first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}