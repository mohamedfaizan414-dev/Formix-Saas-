"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Trash2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportSubmissions } from "./export-submissions";

export function SubmissionsTable({ 
  submissions, 
  formId, 
  formName 
}: { 
  submissions: any[]; 
  formId: string; 
  formName: string;
}) {

  async function deleteSubmission(id: string) {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/submissions/${id}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      toast.success("Submission deleted successfully.");
      // Refresh the page data
      window.location.reload();
    } catch (err) {
      toast.error("Failed to delete submission.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Export Controls */}
      <div className="flex items-end justify-between">
        <div>
          <p className="stamp text-xs text-clinical-sage">Data collection</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">{formName} — Submissions</h1>
        </div>
        <ExportSubmissions submissions={submissions} formName={formName} />
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-md border border-ink/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5 dark:text-white/40">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted By</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8 dark:divide-white/8">
            {submissions.map((sub) => (
              <tr key={sub.id} className="group hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Badge tone={sub.status === "SUBMITTED" ? "sage" : "amber"}>{sub.status}</Badge>
                </td>
                <td className="px-4 py-3 font-medium text-ink dark:text-white/85">
                  {sub.submittedBy?.firstName} {sub.submittedBy?.lastName}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(sub.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/forms/${formId}/submissions/${sub.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-clinical-brick hover:bg-clinical-brick/10"
                      onClick={() => deleteSubmission(sub.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-sm text-ink-soft/60">
                  <Database className="mx-auto mb-3 h-8 w-8 text-ink/20" />
                  No submissions have been recorded for this form yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}