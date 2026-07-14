import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export function Select({
  className,
  children,
  ...props
}) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-xs border border-ink/15 bg-white px-3 pr-8 text-sm text-ink outline-none transition-colors focus:border-clinical-sage",
          "dark:bg-paper-darkdim dark:border-white/15 dark:text-[#DCE7E4]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
    </div>
  );
}
