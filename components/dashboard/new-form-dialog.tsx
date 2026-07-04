"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function NewFormDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function create() {
    if (!name.trim()) return toast.error("Give the form a name first.");
    setLoading(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Couldn't create form");
      router.push(`/forms/${data.form.id}/builder`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New form</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Create a new form">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Form name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. OPD Assessment Form" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={loading}>{loading ? "Creating…" : "Create & open builder"}</Button>
        </div>
      </Dialog>
    </>
  );
}
