// app/public-forms/[token]/page.tsx
import { notFound } from "next/navigation";
import * as React from "react";
import { prisma } from "@/lib/prisma";
import { PatientFormClient } from "./patient-form-client"; // ✅ Import the client bridge wrapper
import type { FormSchema } from "@/lib/form-engine/types";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublicFormPage({ params }: PageProps) {
  // 1. Resolve the asynchronous parameters bundle
  const { token } = await params;

  // 2. Query against the assignment token field constraint column
  const assignment = await prisma.formAssignment.findUnique({
    where: { token: token },
    include: {
      formVersion: true,
      patient: true,
    },
  });

  // 3. Prevent crashes on deleted or missing assignments
  if (!assignment) {
    return notFound();
  }

  // 4. Safely check the submission status state
  const initiallySubmitted = assignment.status === "SUBMITTED";

  // 5. Extract and cast the JSON layout schema definition template
  const formSchema = assignment.formVersion.schema as unknown as FormSchema;

  return (
    <div className="chart-paper min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark flex flex-col justify-center items-center">
      <div className="max-w-3xl w-full bg-white dark:bg-paper-darkdim rounded-md border border-ink/10 dark:border-white/10 p-6 sm:p-10 shadow-panel space-y-6">
        <div>
          <p className="stamp text-[10px] sm:text-xs text-clinical-teal uppercase font-bold tracking-wider">
            {initiallySubmitted ? "Archive Response Record" : "Clinical Submission Portal"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
            {formSchema?.title || assignment.formTitle || "Form"}
          </h1>
          <p className="mt-2 text-xs text-ink-soft">
            Patient File Reference:{" "}
            <span className="font-mono text-ink dark:text-white font-medium">
              {assignment.patient?.firstName} {assignment.patient?.lastName}
            </span>
          </p>
        </div>

        <hr className="border-ink/5" />

        {/* 
          ✅ FIXED: Instead of calling the renderer component directly with an un-passable server function,
          we pass data parameters into PatientFormClient which safely bridges into the React client layer.
        */}
        <PatientFormClient
          token={token}
          schema={formSchema}
          initiallySubmitted={initiallySubmitted}
          initialValues={(assignment.payload as Record<string, unknown>) ?? undefined}
        />
      </div>
    </div>
  );
}