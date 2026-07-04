import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-xs border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-clinical-sage disabled:opacity-50",
        "dark:bg-paper-darkdim dark:border-white/15 dark:text-[#DCE7E4] dark:placeholder:text-white/30",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
