"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Trash2, Rocket, PauseCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormRowActions({ formId, status }: { formId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function clone() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}/clone`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      toast.success("Form cloned.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: status !== "PUBLISHED" }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      toast.success(status === "PUBLISHED" ? "Unpublished." : "Published.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm("Archive this form? Existing submissions are kept.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      toast.success("Form archived.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* 👇 THIS IS THE NEW SUBMISSIONS LINK BUTTON 👇 */}
      <Link href={`/forms/${formId}/submissions`}>
        <Button variant="ghost" size="icon" title="View Submissions">
          <Database className="h-4 w-4 text-clinical-teal" />
        </Button>
      </Link>
      
      <Button variant="ghost" size="icon" onClick={clone} disabled={loading} title="Clone">
        <Copy className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={togglePublish} disabled={loading} title={status === "PUBLISHED" ? "Unpublish" : "Publish"}>
        {status === "PUBLISHED" ? <PauseCircle className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={remove} disabled={loading} title="Archive">
        <Trash2 className="h-4 w-4 text-clinical-brick" />
      </Button>
    </div>
  );
}