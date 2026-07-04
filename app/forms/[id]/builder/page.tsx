import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { BuilderShell } from "@/components/builder/builder-shell";
import type { FormSchema } from "@/lib/form-engine/types";

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const form = await prisma.form.findUnique({ where: { id } });
  if (!form || form.deletedAt) notFound();
  if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) notFound();

  const latestVersion = await prisma.formVersion.findFirst({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
  });

  const schema = (latestVersion?.schema as unknown as FormSchema) ?? {
    title: form.name,
    layout: "single",
    sections: [{ id: "s1", title: "Section 1", components: [] }],
    conditionalRules: [],
  };

  return <BuilderShell formId={form.id} status={form.status} initialSchema={schema} />;
}
