// app/dashboard/patients/[id]/payload-view-section.tsx
"use client";

import * as React from "react";
import { Eye } from "lucide-react";
import { Dialog } from "@/components/ui/dialog"; // 🌟 FIXED: Import ONLY the real standalone Dialog export
import { Button } from "@/components/ui/button";
import { DynamicFormRenderer } from "@/components/renderer/dynamic-form-renderer";
import type { FormSchema } from "@/lib/form-engine/types";

interface AssignmentForView {
  id: string;
  formTitle: string;
  payload: unknown;
  formVersionSchema: FormSchema;
}

export function PayloadViewSection({ assignment }: { assignment: AssignmentForView }) {
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

      {/* 🌟 FIXED: Used your real Dialog component parameters cleanly */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        title="Submitted Response Record"
        className="max-w-2xl" // Keeps the form popup wide and legible
      >
        <div className="mt-2 text-sm text-ink dark:text-white">
          {/* Renders the dynamic form using your exact system renderer structure */}
          <DynamicFormRenderer 
            schema={assignment.formVersionSchema} 
            initialValues={assignment.payload as any} 
            mode="preview" 
          />
        </div>
      </Dialog>
    </>
  );
}