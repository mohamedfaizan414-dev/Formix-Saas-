import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/dashboard/app-shell";
import { SubmissionsTable } from "@/components/dashboard/submissions-table";

export default async function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const form = await prisma.form.findUnique({ where: { id } });
  if (!form || form.deletedAt) notFound();
  if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) notFound();

  const submissions = await prisma.submission.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
    include: { submittedBy: { select: { firstName: true, lastName: true } } },
  });

  return (
    <AppShell active="forms">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <SubmissionsTable submissions={submissions} formId={id} formName={form.name} />
      </div>
    </AppShell>
  );
}