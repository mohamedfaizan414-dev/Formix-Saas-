"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DynamicFormRenderer } from "@/components/renderer/dynamic-form-renderer";
import type { FormSchema } from "@/lib/form-engine/types";
import { submitPublicForm } from "./action";

interface PatientFormClientProps {
  token: string;
  schema: FormSchema;
  initiallySubmitted: boolean;
  initialValues?: Record<string, unknown>;
}

export function PatientFormClient({ token, schema, initiallySubmitted, initialValues }: PatientFormClientProps) {
  const [submitted, setSubmitted] = React.useState(initiallySubmitted);

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-clinical-sage" />
        <h3 className="text-lg font-semibold">Thank you — your form has been submitted</h3>
        <p className="text-sm text-ink-soft/70 max-w-sm">
          Your care team has received your responses. You can safely close this page.
        </p>
      </div>
    );
  }

  return (
    <DynamicFormRenderer
      schema={schema}
      initialValues={initialValues}
      mode="fill"
      onSubmit={async (values, isDraft) => {
        try {
          await submitPublicForm(token, values, isDraft);
          if (!isDraft) {
            setSubmitted(true);
          } else {
            toast.success("Progress saved. You can come back to this link anytime.");
          }
        } catch (err: any) {
          toast.error(err.message ?? "Something went wrong. Please try again.");
        }
      }}
    />
  );
}