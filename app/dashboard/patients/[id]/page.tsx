// app/dashboard/patients/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { PatientService } from "@/lib/services/patient-service";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import type { FormSchema } from "@/lib/form-engine/types";
import { IssueFormSection } from "./issue-form-section";
import { AssignmentRowActions } from "./assignment-row-actions"; // 🌟 Import your new dynamic action matrix controller

export default async function ServerPatientProfileRoute({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const patientId = resolvedParams.id;
  
  const session = await getSession();
  if (!session) redirect("/login");

  const userContext = {
    id: session.sub ?? "",
    organizationId: session.hospitalId ?? "",
    role: session.role as any,
  };

  let patientData;
  try {
    patientData = await PatientService.getPatientDetails(patientId, userContext);
  } catch {
    return notFound();
  }

  const availableFormTemplates = await prisma.form.findMany({
    where: {
      status: "PUBLISHED",
      ...(session.role === "SUPER_ADMIN" ? {} : { hospitalId: session.hospitalId ?? "" }),
    },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const sanitizedTemplates = availableFormTemplates.map((f) => ({ id: f.id, title: f.name }));

  // 🌟 FIXED: Map formVersionId instead of formId to query version profiles accurately!
  const submittedVersionIds = patientData.assignments
    .filter((a) => a.status === "SUBMITTED")
    .map((a) => a.formVersionId);

  const versions = submittedVersionIds.length
    ? await prisma.formVersion.findMany({
        where: { id: { in: submittedVersionIds } },
        select: { id: true, schema: true },
      })
    : [];

  const versionSchemaById = new Map(versions.map((v) => [v.id, v.schema as unknown as FormSchema]));

  return (
    <AppShell active="patients">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/patients">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="stamp text-[10px] text-clinical-sage">Patient Clinical File</p>
            <h1 className="text-xl font-semibold tracking-tight">
              {patientData.firstName} {patientData.lastName}
            </h1>
          </div>
        </div>

        <div className="rounded-md border border-ink/10 bg-white p-5 dark:border-white/10 dark:bg-paper-darkdim shadow-panel">
          <p className="text-xs font-mono text-ink-soft">
            Email: <span className="text-ink dark:text-white font-medium">{patientData.email}</span>
          </p>
          {patientData.phone && (
            <p className="text-xs font-mono text-ink-soft mt-1">
              Phone: <span className="text-ink dark:text-white font-medium">{patientData.phone}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-sage">Intake History Ledger</h3>
            <div className="rounded-md border border-ink/10 bg-white divide-y divide-ink/8 dark:bg-paper-darkdim dark:border-white/10 overflow-hidden shadow-panel">
              {patientData.assignments.map((asg) => {
                const formTitle = (asg as any).formTitle ?? asg.formId;
                return (
                  <div key={asg.id} className="p-4 flex sm:items-center justify-between flex-col sm:flex-row gap-3 text-sm">
                    <div>
                      <h4 className="font-medium text-ink dark:text-white">{formTitle}</h4>
                      <p className="text-xs text-ink-soft/70 mt-0.5">Issued: {new Date(asg.sentAt).toLocaleDateString()}</p>
                    </div>
                    
                    {/* 🌟 CONNECTED NEW INTERACTIVE CLUSTER */}
                    <AssignmentRowActions 
                      assignment={{
                        id: asg.id,
                        status: asg.status,
                        formTitle: formTitle,
                        payload: asg.payload,
                        formVersionId: asg.formVersionId
                      }}
                      formVersionSchema={versionSchemaById.get(asg.formVersionId)}
                    />
                  </div>
                );
              })}
              {patientData.assignments.length === 0 && (
                <p className="p-6 text-xs italic text-ink-soft/50 text-center bg-white dark:bg-paper-darkdim">
                  No digital forms have been issued to this profile yet.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-sage">Issue Document</h3>
            <IssueFormSection
              patientId={patientData.id}
              patientEmail={patientData.email}
              patientName={`${patientData.firstName ?? ""} ${patientData.lastName ?? ""}`.trim()}
              availableForms={sanitizedTemplates}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}