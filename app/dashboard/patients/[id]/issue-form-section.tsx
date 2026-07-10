"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FormOption {
  id: string;
  title: string;
}

interface IssueFormSectionProps {
  patientId: string;
  patientEmail: string;
  patientName: string;
  availableForms: FormOption[];
}

export function IssueFormSection({ patientId, patientEmail, patientName, availableForms }: IssueFormSectionProps) {
  const router = useRouter();
  const [selectedFormId, setSelectedFormId] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function handleSend() {
    if (!selectedFormId) {
      toast.error("Choose a form first.");
      return;
    }
    
    setSending(true);
    try {
      // 🌟 FIXED: Pass all attributes down to the request body to fulfill email service contracts
      const res = await fetch("/api/patients/assign-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          patientId, 
          formId: selectedFormId,
          patientEmail,
          patientName,
          formTitle: availableForms.find(f => f.id === selectedFormId)?.title || "Clinical Document"
        }),
      });

      // Avoid unexpected end of JSON errors if status codes fail
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Server rejected request with an empty body." }));
        throw new Error(errData.error || "Failed to process form assignment.");
      }

      toast.success("Form sent to patient's email.");
      setSelectedFormId("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected network error occurred.");
    } finally {
      setSending(false);
    }
  }

  if (availableForms.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 p-4 text-xs text-ink-soft/60">
        No published forms available yet under this hospital.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim shadow-panel">
      <Select value={selectedFormId} onChange={(e) => setSelectedFormId(e.target.value)}>
        <option value="">Select a form...</option>
        {availableForms.map((f) => (
          <option key={f.id} value={f.id}>{f.title}</option>
        ))}
      </Select>
      <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending..." : "Send to patient"}
      </Button>
    </div>
  );
}