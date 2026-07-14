import * as React from "react";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";

export function DeleteHospitalDialog({ hospitalId, hospitalName, onSuccess }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals/${hospitalId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete the organization.");
        return;
      }

      toast.success(`${hospitalName} and all associated data have been permanently deleted.`);
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Network interface connection failure.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setOpen(true)} 
        title="Delete Organization"
        className="text-clinical-brick hover:bg-clinical-brick/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Confirm Permanent Deletion" className="w-full max-w-md p-4 sm:p-6">
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3 rounded-xs border border-clinical-brick/20 bg-clinical-bricklight/30 p-3 text-clinical-brick">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-xs font-semibold uppercase tracking-wide font-mono">System Warning</p>
          </div>
          
          <p className="text-sm text-ink-soft dark:text-white/70 leading-relaxed">
            Are you absolutely sure you want to delete <span className="font-bold text-ink dark:text-white">“{hospitalName}”</span>?
          </p>
          
          <p className="text-xs text-clinical-brick font-medium leading-normal bg-clinical-brick/5 p-2.5 rounded-xs border border-dashed border-clinical-brick/10">
            This administrative operation is irreversible. Proceeding will immediately and permanently purge all associated departments, clinical forms, schema histories, user directories, and patient submission records from the multi-tenant cluster.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2.5 w-full">
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            disabled={loading}
            className="w-full sm:w-auto order-2 sm:order-1 h-9 text-xs sm:text-sm"
          >
            Cancel
          </Button>
          <Button 
            variant="brick" 
            onClick={handleDelete} 
            disabled={loading}
            className="w-full sm:w-auto order-1 sm:order-2 h-9 text-xs sm:text-sm"
          >
            {loading ? "Purging Cluster…" : "Confirm Delete"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
