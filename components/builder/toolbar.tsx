"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Undo2, Redo2, Eye, Save, Rocket, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { ConditionalLogicButton } from "./conditional-logic-panel";
import { AiGenerateButton } from "./ai-generate-dialog";

export function BuilderToolbar({ formId, status }: { formId: string; status: string }) {
  const router = useRouter();
  const schema = useBuilderStore((s) => s.schema);
  const updateComponent = useBuilderStore((s) => s.updateComponent);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const history = useBuilderStore((s) => s.history);
  const future = useBuilderStore((s) => s.future);
  const setSchema = useBuilderStore((s) => s.setSchema);
  const [saving, setSaving] = React.useState(false);
  const [previewing, setPreviewing] = React.useState(false);
  const [title, setTitle] = React.useState(schema.title);

  React.useEffect(() => setTitle(schema.title), [schema.title]);

  async function save(publish = false) {
    setSaving(true);
    try {
      const nextSchema = { ...schema, title };
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: nextSchema, name: title, changelog: publish ? "Published from builder" : "Saved from builder" }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Save failed");
        return;
      }
      setSchema(nextSchema);
      if (publish) {
        const pub = await fetch(`/api/forms/${formId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true }),
        });
        if (!pub.ok) {
          const d = await pub.json();
          toast.error(d.error ?? "Publish failed");
          return;
        }
        toast.success("Form published — a new version is now live.");
      } else {
        toast.success("Saved as a new version.");
      }
      router.refresh();
    } catch {
      toast.error("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setPreviewing(true);
    try {
      const nextSchema = { ...schema, title };
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: nextSchema, name: title, changelog: "Preview snapshot" }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Couldn't prepare preview");
        return;
      }
      setSchema(nextSchema);
      window.open(`/forms/${formId}/preview`, "_blank");
    } catch {
      toast.error("Network error while preparing preview.");
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-ink/10 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-paper-darkdim">
      <div className="flex items-center gap-3">
        <Link href="/forms"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-56 bg-transparent font-display text-sm font-semibold outline-none"
        />
        <Badge tone={status === "PUBLISHED" ? "sage" : "amber"}>{status}</Badge>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={undo} disabled={!history.length} title="Undo"><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!future.length} title="Redo"><Redo2 className="h-4 w-4" /></Button>
        <div className="mx-1.5 h-5 w-px bg-ink/10 dark:bg-white/10" />
        <ConditionalLogicButton />
        <AiGenerateButton />
        <Link href={`/forms/${formId}/versions`}><Button variant="ghost" size="sm"><History className="h-3.5 w-3.5" /> Versions</Button></Link>
        <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewing}>
          <Eye className="h-3.5 w-3.5" /> {previewing ? "Preparing…" : "Preview"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => save(false)} disabled={saving}><Save className="h-3.5 w-3.5" /> Save draft</Button>
        <Button size="sm" onClick={() => save(true)} disabled={saving}><Rocket className="h-3.5 w-3.5" /> Publish</Button>
      </div>
    </div>
  );
}