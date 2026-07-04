import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function VersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const form = await prisma.form.findUnique({ where: { id } });
  if (!form) notFound();
  if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) notFound();

  const versions = await prisma.formVersion.findMany({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });

  return (
    <main className="min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark">
      <div className="mx-auto max-w-2xl">
        <Link href={`/forms/${id}/builder`}><Button variant="ghost" size="sm"><ArrowLeft className="h-3.5 w-3.5" /> Back to builder</Button></Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">{form.name} — Version history</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-white/50">Every save creates an immutable version. Old submissions stay linked to the version they were filled against.</p>

        <div className="mt-6 space-y-3">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border border-ink/10 p-4 dark:border-white/10">
              <div>
                <p className="font-display text-sm font-semibold">Version {v.versionNumber}</p>
                <p className="mt-0.5 text-xs text-ink-soft/70">
                  {v.createdBy.firstName} {v.createdBy.lastName} · {new Date(v.createdAt).toLocaleString()}
                </p>
                {v.changelog && <p className="mt-1 text-xs text-ink-soft/60">{v.changelog}</p>}
              </div>
              {v.isPublished && <Badge tone="sage">Published</Badge>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
