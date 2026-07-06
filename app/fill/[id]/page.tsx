// app/fill/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Home, RefreshCw } from "lucide-react"; 
import { DynamicFormRenderer } from "@/components/renderer/dynamic-form-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FormSchema } from "@/lib/form-engine/types";

function draftStorageKey(formId: string) {
  return `form-draft:${formId}`;
}

export default function FillFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<any>(null);
  const [schema, setSchema] = React.useState<FormSchema | null>(null);
  const [versionId, setVersionId] = React.useState<string | null>(null);
  const [initialValues, setInitialValues] = React.useState<Record<string, unknown> | undefined>(undefined);
  const [hasSession, setHasSession] = React.useState(false);
  const [submissionId, setSubmissionId] = React.useState<string | null>(null);
  
  // Track successful submissions to render confirmation layouts safely
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then((r) => r.json())
      .then(async (data) => {
        setForm(data.form);
        setSchema(data.latestSchema);
        setVersionId(data.versions?.[0]?.id ?? null);

        const sessionExists = !!data.hasSession || !!data.user;
        setHasSession(sessionExists);

        if (!sessionExists && typeof window !== "undefined") {
          const savedId = window.localStorage.getItem(draftStorageKey(id));
          if (savedId) {
            try {
              const draftRes = await fetch(`/api/submissions/${savedId}`);
              if (draftRes.ok) {
                const draftData = await draftRes.json();
                if (draftData.submission?.status === "DRAFT") {
                  setSubmissionId(draftData.submission.id);
                  setInitialValues(draftData.submission.data ?? undefined);
                }
              } else {
                window.localStorage.removeItem(draftStorageKey(id));
              }
            } catch {
              // Non-fatal edge recovery
            }
          }
        }
      })
      .catch(() => setHasSession(false))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: Record<string, unknown>, isDraft: boolean) {
    const finalSubmitState = !isDraft;

    try {
      const res = submissionId
        ? await fetch(`/api/submissions/${submissionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: values, submit: finalSubmitState }),
          })
        : await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              formId: id,
              formVersionId: versionId,
              data: values,
              submit: finalSubmitState,
              isPublic: !hasSession, // Flags submission as public if user isn't signed in
            }),
          });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "The server rejected your submission.");
      }

      const resData = await res.json();
      const savedSubmission = resData.submission;

      if (!hasSession && typeof window !== "undefined") {
        if (finalSubmitState) {
          window.localStorage.removeItem(draftStorageKey(id));
        } else if (savedSubmission?.id) {
          setSubmissionId(savedSubmission.id);
          window.localStorage.setItem(draftStorageKey(id), savedSubmission.id);
        }
      }

      toast.success(!finalSubmitState ? "Draft progress saved!" : "Form submitted successfully!");

      if (finalSubmitState) {
        if (hasSession) {
          setTimeout(() => {
            router.push("/dashboard");
          }, 300);
        } else {
          setIsSubmitted(true); // Switches layout to confirmation panel safely
        }
      }
    } catch (err: any) {
      console.error("Submission failed runtime tracking error:", err);
      toast.error(err.message ?? "Could not save submission parameters.");
      setIsSubmitted(false); 
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-soft">Loading form…</main>;
  if (!schema) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-soft">This form has no published version yet.</main>;

  return (
    <main className="chart-paper min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark">
      <div className="mx-auto max-w-3xl">
        
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-md border border-ink/10 bg-white dark:bg-paper-darkdim dark:border-white/10 shadow-panel mt-10 animate-stampIn">
            <CheckCircle2 className="h-12 w-12 text-clinical-sage mb-4" strokeWidth={1.5} />
            <h2 className="font-display text-xl font-semibold text-ink dark:text-white">Submission Received</h2>
            <p className="mt-2 text-sm text-ink-soft max-w-sm leading-relaxed">
              Your data parameters for <span className="font-medium text-ink dark:text-white">"{schema.title}"</span> have been securely encrypted and transmitted to the clinical registry.
            </p>
            <div className="mt-8 flex gap-3">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Submit another response
              </Button>
              <Button size="sm" onClick={() => router.push("/")} className="flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" /> Return home
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold">{schema.title}</h1>
              <Badge tone="sage">{form?.status}</Badge>
            </div>

            <DynamicFormRenderer
              schema={schema}
              mode="fill"
              initialValues={initialValues}
              onSubmit={handleSubmit}
            />
          </>
        )}

      </div>
    </main>
  );
}