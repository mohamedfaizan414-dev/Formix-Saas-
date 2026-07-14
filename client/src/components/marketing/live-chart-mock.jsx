import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, GripVertical } from "lucide-react";

const rows = [
  { label: "Patient name", value: "Priya Nair", type: "text" },
  { label: "Gender", value: "Female", type: "dropdown" },
  { label: "Pregnancy section", value: "Visible — rule matched", type: "conditional" },
  { label: "Systolic BP", value: "118 mmHg", type: "vitals" },
  { label: "Consent acknowledged", value: "Signed", type: "signature" },
];

export function LiveChartMock() {
  return (
    <div className="mx-auto max-w-2xl rounded-md border border-ink/10 bg-white/70 p-1.5 shadow-panel backdrop-blur-sm dark:border-white/10 dark:bg-paper-darkdim/70">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-2.5 dark:border-white/10">
        <span className="h-2 w-2 rounded-full bg-clinical-brick/60" />
        <span className="h-2 w-2 rounded-full bg-clinical-amber/60" />
        <span className="h-2 w-2 rounded-full bg-clinical-sage/60" />
        <span className="stamp ml-2 text-[10px] text-ink-soft/70">opd_assessment_form.json</span>
      </div>
      <div className="divide-y divide-ink/8 dark:divide-white/8">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.09, duration: 0.35 }}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <GripVertical className="h-3.5 w-3.5 text-ink/25" />
              <span className="text-sm text-ink-soft dark:text-white/60">{row.label}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-clinical-tealdeep dark:text-clinical-sagelight">
              {row.type === "conditional" && <CheckCircle2 className="h-3.5 w-3.5 text-clinical-sage" />}
              {row.value}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
