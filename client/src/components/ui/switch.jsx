import * as React from "react";
import { cn } from "../../lib/utils/cn";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinical-teal focus-visible:ring-offset-2",
        checked ? "bg-clinical-teal" : "bg-ink/20 dark:bg-white/20",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
