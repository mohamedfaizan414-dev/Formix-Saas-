"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { DynamicFormRenderer } from "@/components/renderer/dynamic-form-renderer";
import { Badge } from "@/components/ui/badge";
import type { FormSchema } from "@/lib/form-engine/types";

export default function FillFormPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<any>(null);
  const [schema, setSchema] = React.useState<FormSchema | null>(null);
  const [versionId, setVersionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm(data.form);
        setSchema(data.latestSchema);
        setVersionId(data.versions?.[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: Record<string, unknown>, isDraft: boolean) {
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId: id, formVersionId: versionId, data: values, submit: !isDraft }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Could not save submission.");
      return;
    }
    if (!isDraft) router.push("/dashboard");
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-soft">Loading form…</main>;
  if (!schema) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-soft">This form has no published version yet.</main>;

  return (
    <main className="chart-paper min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold">{schema.title}</h1>
          <Badge tone="sage">{form?.status}</Badge>
        </div>
        <DynamicFormRenderer schema={schema} mode="fill" onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
