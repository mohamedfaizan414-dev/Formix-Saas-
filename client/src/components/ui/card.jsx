import * as React from "react";
import { cn } from "../../lib/utils/cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-md border border-ink/10 bg-white shadow-panel dark:bg-paper-darkdim dark:border-white/10",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("border-b border-ink/10 px-5 py-4 dark:border-white/10", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-display text-base font-semibold", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
