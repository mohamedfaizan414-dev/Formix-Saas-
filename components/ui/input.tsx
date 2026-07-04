import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xs border border-ink/15 bg-white px-3 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-clinical-sage disabled:opacity-50 disabled:bg-ink/5",
        "dark:bg-paper-darkdim dark:border-white/15 dark:text-[#DCE7E4] dark:placeholder:text-white/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
