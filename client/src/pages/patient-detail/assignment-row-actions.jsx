import * as React from "react";
import { Eye, Trash2, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Dialog } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { DynamicFormRenderer } from "../../components/renderer/dynamic-form-renderer";
import { toast } from "sonner";

export function AssignmentRowActions({ assignment, formVersionSchema, onSuccess }) {
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the assignment ledger record for "${assignment.formTitle}"?`)) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/patients?id=${assignment.id}&type=assignment`, { 
        method: "DELETE" 
      });
      
      if (!res.ok) throw new Error("Unlinking failed");
      
      toast.success("Assignment history item deleted successfully.");
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to delete form assignment record.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 self-end sm:self-auto">
      {assignment.status === "SUBMITTED" ? (
        <span className="flex items-center gap-1 text-xs font-medium text-clinical-sage shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-clinical-amber shrink-0">
          <Clock className="h-3.5 w-3.5" /> Pending
        </span>
      )}

      {assignment.status === "SUBMITTED" && formVersionSchema ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1 text-xs px-2.5" 
          onClick={() => setOpen(true)}
        >
          <Eye className="h-3.5 w-3.5" /> View details
        </Button>
      ) : assignment.status === "SUBMITTED" ? (
        <span className="text-[11px] text-ink-soft/40 italic">Schema unavailable</span>
      ) : null}

      <Button 
        variant="ghost" 
        size="sm"
        disabled={isDeleting}
        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
        onClick={handleDelete}
        title="Delete Form Assignment Record"
      >
        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>

      {open && formVersionSchema && (
        <Dialog 
          open={open} 
          onClose={() => setOpen(false)} 
          title={`Submitted Response: ${assignment.formTitle}`}
          className="max-w-2xl"
        >
          <div className="mt-4 text-sm text-ink dark:text-white max-h-[65vh] overflow-y-auto thin-scroll pr-1">
            <DynamicFormRenderer 
              schema={formVersionSchema} 
              initialValues={assignment.payload ?? {}} 
              mode="preview" 
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}
