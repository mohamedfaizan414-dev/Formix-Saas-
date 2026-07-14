import * as React from "react";
import { Eye } from "lucide-react";
import { Dialog } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { DynamicFormRenderer } from "../../components/renderer/dynamic-form-renderer";

export function PayloadViewSection({ assignment }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 gap-1 text-[11px] px-2" 
        onClick={() => setOpen(true)}
      >
        <Eye className="h-3 w-3" /> View submission
      </Button>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        title="Submitted Response Record"
        className="max-w-2xl"
      >
        <div className="mt-2 text-sm text-ink dark:text-white">
          <DynamicFormRenderer 
            schema={assignment.formVersionSchema} 
            initialValues={assignment.payload} 
            mode="preview" 
          />
        </div>
      </Dialog>
    </>
  );
}
