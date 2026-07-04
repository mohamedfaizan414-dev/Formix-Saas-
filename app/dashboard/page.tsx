import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/rbac/permissions";
import { FileStack, ClipboardList, Building2, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isBuilderRole = session.role === "SUPER_ADMIN" || session.role === "HOSPITAL_ADMIN";
  const hospitalWhere: { hospitalId?: string } =
    session.role === "SUPER_ADMIN"
      ? {}
      : { hospitalId: session.hospitalId ?? undefined };

  if (isBuilderRole) {
    const [formCount, publishedCount, submissionCount, hospitalCount] = await Promise.all([
      prisma.form.count({ where: { deletedAt: null, ...hospitalWhere } }),
      prisma.form.count({ where: { deletedAt: null, status: "PUBLISHED", ...hospitalWhere } }),
      prisma.submission.count({ where: hospitalWhere }),
      session.role === "SUPER_ADMIN" ? prisma.hospital.count() : Promise.resolve(1),
    ]);

    const recentForms = await prisma.form.findMany({
      where: { deletedAt: null, ...hospitalWhere },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });

    return (
      <AppShell active="dashboard">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <p className="stamp text-xs text-clinical-sage">{ROLE_LABELS[session.role]} dashboard</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Overview</h1>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total forms", value: formCount, icon: FileStack },
              { label: "Published", value: publishedCount, icon: Activity },
              { label: "Submissions", value: submissionCount, icon: ClipboardList },
              ...(session.role === "SUPER_ADMIN" ? [{ label: "Hospitals", value: hospitalCount, icon: Building2 }] : []),
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold font-display">{stat.value}</p>
                    <p className="text-xs text-ink-soft">{stat.label}</p>
                  </div>
                  <stat.icon className="h-5 w-5 text-clinical-sage" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader><CardTitle>Recently updated forms</CardTitle></CardHeader>
            <CardContent className="divide-y divide-ink/8 p-0 dark:divide-white/8">
              {recentForms.map((f) => (
                <Link key={f.id} href={`/forms/${f.id}/builder`} className="flex items-center justify-between px-5 py-3 hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]">
                  <span className="text-sm font-medium">{f.name}</span>
                  <Badge tone={f.status === "PUBLISHED" ? "sage" : "amber"}>{f.status}</Badge>
                </Link>
              ))}
              {recentForms.length === 0 && <p className="px-5 py-6 text-sm text-ink-soft/60">No forms yet.</p>}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Clinical roles: Doctor / Nurse / Receptionist
  const publishedForms = await prisma.form.findMany({
    where: { status: "PUBLISHED", hospitalId: session.hospitalId ?? undefined, deletedAt: null },
    orderBy: { name: "asc" },
  });
  const myDrafts = await prisma.submission.findMany({
    where: { submittedById: session.sub, status: "DRAFT" },
    include: { form: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <AppShell active="dashboard">
      <div className="mx-auto max-w-4xl px-8 py-10">
        <p className="stamp text-xs text-clinical-sage">{ROLE_LABELS[session.role]} dashboard</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">Available forms</h1>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {publishedForms.map((f) => (
            <Link key={f.id} href={`/fill/${f.id}`} className="rounded-md border border-ink/10 bg-white p-5 shadow-panel transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-paper-darkdim">
              <p className="font-display text-sm font-semibold">{f.name}</p>
              <p className="mt-1 text-xs text-ink-soft/70">{f.description}</p>
            </Link>
          ))}
          {publishedForms.length === 0 && <p className="text-sm text-ink-soft/60">No published forms available yet.</p>}
        </div>

        {myDrafts.length > 0 && (
          <Card className="mt-8">
            <CardHeader><CardTitle>Your drafts</CardTitle></CardHeader>
            <CardContent className="divide-y divide-ink/8 p-0 dark:divide-white/8">
              {myDrafts.map((d) => (
                <Link key={d.id} href={`/fill/${d.formId}`} className="flex items-center justify-between px-5 py-3 hover:bg-ink/[0.02]">
                  <span className="text-sm">{d.form.name}</span>
                  <Badge tone="amber">Draft</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
