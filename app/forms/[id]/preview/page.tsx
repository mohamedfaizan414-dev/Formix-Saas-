import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { DynamicFormRenderer } from "@/components/renderer/dynamic-form-renderer";
import type { FormSchema } from "@/lib/form-engine/types";
import { Badge } from "@/components/ui/badge";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const form = await prisma.form.findUnique({ where: { id } });
  if (!form) notFound();
  if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) notFound();

  const latestVersion = await prisma.formVersion.findFirst({ where: { formId: id }, orderBy: { versionNumber: "desc" } });
  const schema = latestVersion?.schema as unknown as FormSchema;

  return (
    <main className="chart-paper min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold">{schema?.title ?? form.name}</h1>
          <Badge tone="amber">Preview · v{latestVersion?.versionNumber}</Badge>
        </div>
        {schema ? <DynamicFormRenderer schema={schema} mode="preview" /> : <p>No version to preview yet.</p>}
      </div>
    </main>
  );
}
