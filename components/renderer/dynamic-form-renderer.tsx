// components/renderer/dynamic-form-renderer.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { FieldRenderer, widthClass } from "./field-renderer";
import { computeRuntimeState } from "@/lib/form-engine/conditional-engine";
import { buildZodSchemaForNodes } from "@/lib/form-engine/build-zod-schema";
import { isLayoutType } from "@/lib/form-engine/field-registry";
import { packGrid, rectToGridStyle } from "@/lib/form-engine/grid-engine";
import type { FormComponentNode, FormSchema } from "@/lib/form-engine/types";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface DynamicFormRendererProps {
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  mode?: "fill" | "preview";
  onSubmit?: (values: Record<string, unknown>, isDraft: boolean) => Promise<void> | void;
}

function collectVisibleNodes(
  nodes: FormComponentNode[],
  fieldStates: ReturnType<typeof computeRuntimeState>["fields"]
): FormComponentNode[] {
  const out: FormComponentNode[] = [];
  for (const n of nodes) {
    const state = fieldStates[n.id];
    if (state && !state.visible) continue;
    out.push(n);
    if (n.children) out.push(...collectVisibleNodes(n.children, fieldStates));
  }
  return out;
}

export function DynamicFormRenderer({ schema, initialValues, mode = "fill", onSubmit }: DynamicFormRendererProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>(initialValues ?? {});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const runtime = React.useMemo(() => computeRuntimeState(schema, values), [schema, values]);
  const setValue = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  const section = schema.sections[activeSection];
  
  // Filter active visibility filters
  const visibleNodes = React.useMemo(() => {
    return section.components.filter((n) => runtime.fields[n.id]?.visible ?? true);
  }, [section.components, runtime.fields]);

  // Derive layout positions in real time using the Skyline packer
  const layout = React.useMemo(() => packGrid(visibleNodes), [visibleNodes]);

  const isLastSection = activeSection === schema.sections.length - 1;

  async function handleSubmit(e: React.FormEvent, isDraft: boolean) {
    e.preventDefault();
    const visible = collectVisibleNodes(schema.sections.flatMap((s) => s.components), runtime.fields);
    const zodSchema = buildZodSchemaForNodes(visible);
    const result = zodSchema.safeParse(values);

    if (!result.success && !isDraft) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit?.(values, isDraft);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 w-full">
      {schema.sections.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 w-full">
          {schema.sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(i)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                i === activeSection ? "border-clinical-teal bg-clinical-teal text-paper" : "border-ink/15 text-ink-soft hover:bg-ink/5"
              )}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      )}

      {/* 🌟 12-COLUMN grid mapping container */}
      <div 
        className="w-full grid content-start items-start gap-x-4 gap-y-3"
        style={{
          gridTemplateColumns: `repeat(12, minmax(0, 1fr))`,
          gridAutoRows: `minmax(45px, auto)`
        }}
      >
        {visibleNodes.map((node) => {
          const rect = layout.positions.get(node.id);
          if (!rect) return null;
          const gridStyle = rectToGridStyle(rect);

          if (isLayoutType(node.type)) {
            return (
              <div key={node.id} style={gridStyle} className="w-full border border-ink/10 rounded-md p-4 bg-white dark:bg-paper-darkdim">
                {node.label && <h4 className="mb-2 text-xs font-semibold text-clinical-sage uppercase tracking-wider">{node.label}</h4>}
                <div className="space-y-3">
                  {(node.children ?? []).map((child) => (
                    <FieldRenderer
                      key={child.id}
                      node={child}
                      value={values[child.internalName]}
                      onChange={(v) => setValue(child.internalName, v)}
                      disabled={runtime.fields[child.id]?.disabled}
                      error={errors[child.internalName]}
                    />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={node.id} style={gridStyle} className="w-full min-w-0">
              <FieldRenderer
                node={node}
                value={values[node.internalName]}
                onChange={(v) => setValue(node.internalName, v)}
                disabled={runtime.fields[node.id]?.disabled}
                error={errors[node.internalName]}
              />
            </div>
          );
        })}
      </div>

      {mode === "fill" && (
        <div className="flex items-center justify-between border-t border-ink/10 pt-4 dark:border-white/10 w-full">
          <div>
            {activeSection > 0 && (
              <Button type="button" variant="outline" onClick={() => setActiveSection((s) => s - 1)}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" disabled={submitting} onClick={(e) => handleSubmit(e as any, true)}>
              Save draft
            </Button>
            {!isLastSection ? (
              <Button type="button" onClick={() => setActiveSection((s) => s + 1)}>
                Next section
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit form"}
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}