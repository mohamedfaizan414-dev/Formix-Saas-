import * as React from "react";
import { cn } from "../../lib/utils/cn";

const styles = {
  teal: "bg-clinical-teal/10 text-clinical-teal border-clinical-teal/20",
  sage: "bg-clinical-sagelight text-clinical-tealdeep border-clinical-sage/30",
  brick: "bg-clinical-bricklight text-clinical-brick border-clinical-brick/30",
  amber: "bg-clinical-amberlight text-[#8a6212] border-clinical-amber/30",
  neutral: "bg-ink/5 text-ink-soft border-ink/10",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium font-mono uppercase tracking-wide",
        styles[tone],
        className
      )}
      {...props}
    />
  );
}
