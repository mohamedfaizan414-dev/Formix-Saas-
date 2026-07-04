"use client";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface TabsContext {
  value: string;
  setValue: (v: string) => void;
}
const Ctx = React.createContext<TabsContext | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Ctx.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("inline-flex items-center gap-1 rounded-xs bg-ink/5 p-1 dark:bg-white/5", className)}>{children}</div>;
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      className={cn(
        "rounded-xs px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-white text-clinical-teal shadow-sm dark:bg-paper-dark" : "text-ink-soft hover:text-ink dark:text-white/50"
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx)!;
  if (ctx.value !== value) return null;
  return <div>{children}</div>;
}
