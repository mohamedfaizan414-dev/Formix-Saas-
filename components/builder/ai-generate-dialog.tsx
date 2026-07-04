"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBuilderStore } from "@/lib/form-engine/builder-store";

export function AiGenerateButton() {
  const [open, setOpen] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const setSchema = useBuilderStore((s) => s.setSchema);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      setSchema(data.schema);
      toast.success("Draft generated — review and adjust as needed.");
      setOpen(false);
    } catch {
      toast.error("Couldn't reach the AI service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="brick" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="h-3.5 w-3.5" /> Generate with AI
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Describe the form you need">
        <p className="mb-3 text-sm text-ink-soft dark:text-white/50">
          Powered by Groq. This replaces the current canvas — save first if you want to keep it.
        </p>
        <Textarea
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A pediatric nursing assessment form with vitals, allergies, immunization history, and a parent consent signature."
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={generate} disabled={loading}>{loading ? "Generating…" : "Generate"}</Button>
        </div>
      </Dialog>
    </>
  );
}
