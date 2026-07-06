import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/dashboard/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DynamicFormRenderer } from "@/components/renderer/dynamic-form-renderer";
import type { FormSchema } from "@/lib/form-engine/types";

export default async function SubmissionViewPage({ params }: { params: Promise<{ id: string, subId: string }> }) {
  const { id, subId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  // CORRECTED: findUnique strictly takes the unique ID. 
  const submission = await prisma.submission.findUnique({
    where: { id: subId },
    include: { form: true, formVersion: true, submittedBy: true }
  });

  // Verify submission exists AND that it belongs to the URL's formId
  if (!submission || submission.formId !== id) notFound();
  
  // Tenant isolation guardrail
  if (session.role !== "SUPER_ADMIN" && submission.hospitalId !== session.hospitalId) notFound();

  // Cast the schema and data
  const schema = submission.formVersion.schema as unknown as FormSchema;
  const data = submission.data as Record<string, unknown>;

  return (
    <AppShell active="forms">
      <div className="mx-auto max-w-4xl px-8 py-10">
        <Link href={`/forms/${id}/submissions`}>
          <Button variant="ghost" size="sm" className="-ml-3 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to submissions
          </Button>
        </Link>

        <div className="mb-8 flex items-center justify-between border-b border-ink/10 pb-6 dark:border-white/10">
          <div>
            <p className="stamp text-xs text-clinical-sage">{submission.form.name}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              Submission from {submission.submittedBy.firstName} {submission.submittedBy.lastName}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Submitted on {new Date(submission.createdAt).toLocaleString()} · Against schema v{submission.formVersion.versionNumber}
            </p>
          </div>
          <Badge tone={submission.status === "SUBMITTED" ? "sage" : "amber"}>{submission.status}</Badge>
        </div>

   {/* We use mode="view" to trigger the Clinical EHR Chart style */}
       {/* 🌟 FIXED: Swapped 'view' to 'preview' to match the allowed types */}
<div className="rounded-md border border-ink/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-paper-darkdim">
  <DynamicFormRenderer schema={schema} initialValues={data} mode="preview" />
</div>
      </div>
    </AppShell>
  );
}