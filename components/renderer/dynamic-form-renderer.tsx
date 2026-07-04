// components/renderer/dynamic-form-renderer.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { FieldRenderer } from "./field-renderer";
import { computeRuntimeState } from "@/lib/form-engine/conditional-engine";
import { buildZodSchemaForNodes } from "@/lib/form-engine/build-zod-schema";
import { isLayoutType } from "@/lib/form-engine/field-registry";
import type { FormComponentNode, FormSchema } from "@/lib/form-engine/types";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface DynamicFormRendererProps {
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  mode?: "fill" | "preview" | "view";   
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

function renderNode(
  node: FormComponentNode,
  values: Record<string, unknown>,
  setValue: (name: string, v: unknown) => void,
  fieldStates: ReturnType<typeof computeRuntimeState>["fields"],
  errors: Record<string, string>,
  mode: "fill" | "preview" | "view"
): React.ReactNode {
  const state = fieldStates[node.id];
  if (state && !state.visible) return null;

  if (isLayoutType(node.type)) {
    const childNodes = (node.children ?? []).map((c) => renderNode(c, values, setValue, fieldStates, errors, mode));
    switch (node.type) {
      case "row":
        return (
          <div key={node.id} className="flex flex-wrap w-full">
            {childNodes}
          </div>
        );
      case "section":
        return (
          <fieldset key={node.id} className="w-full space-y-2 rounded-md border border-ink/10 p-3 sm:p-5 dark:border-white/10 box-border my-2">
            {node.label && <legend className="stamp px-1.5 text-[10px] sm:text-xs font-semibold text-clinical-sage tracking-wider">{node.label}</legend>}
            <div className="flex flex-wrap w-full">{childNodes}</div>
          </fieldset>
        );
      case "card":
        return (
          <div key={node.id} className="w-full rounded-md border border-ink/10 bg-white p-3 sm:p-5 shadow-panel dark:border-white/10 dark:bg-paper-darkdim box-border my-2">
            {node.label && <h4 className="mb-2.5 font-display text-xs sm:text-sm font-semibold text-ink dark:text-white/90 break-words">{node.label}</h4>}
            <div className="flex flex-wrap w-full">{childNodes}</div>
          </div>
        );
      default:
        return <div key={node.id} className="flex w-full flex-wrap">{childNodes}</div>;
    }
  }

  return (
    <FieldRenderer
      key={node.id}
      node={node}
      value={values[node.internalName]}
      onChange={(v) => setValue(node.internalName, v)}
      disabled={state?.disabled || mode === "view"}
      readOnlyView={mode === "view"}
      error={errors[node.internalName]}
    />
  );
}

export function DynamicFormRenderer({ schema, initialValues, mode = "fill", onSubmit }: DynamicFormRendererProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>(initialValues ?? {});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const runtime = React.useMemo(() => computeRuntimeState(schema, values), [schema, values]);
  const setValue = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  const nodeIdToName = React.useMemo(() => {
    const map: Record<string, string> = {};
    const walk = (nodes: FormComponentNode[]) => {
      for (const n of nodes) {
        map[n.id] = n.internalName;
        if (n.children) walk(n.children);
      }
    };
    schema.sections.forEach((s) => walk(s.components));
    return map;
  }, [schema]);

  React.useEffect(() => {
    const patch: Record<string, unknown> = {};
    let changed = false;
    Object.entries(runtime.fields).forEach(([nodeId, state]) => {
      if (state.forcedValue !== undefined) {
        const name = nodeIdToName[nodeId];
        if (name && values[name] !== state.forcedValue) {
          patch[name] = state.forcedValue;
          changed = true;
        }
      }
    });
    if (changed) setValues((prev) => ({ ...prev, ...patch }));
  }, [runtime, values, nodeIdToName]);

  const section = schema.sections[activeSection];
  const allNodesInSection = section?.components ?? [];

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
      toast.error("Some fields need attention before you can submit.");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit?.(values, isDraft);
      if (!isDraft) toast.success("Form submitted.");
      else toast.success("Draft saved.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLastSection = activeSection === schema.sections.length - 1;

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {schema.sections.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 thin-scroll scroll-smooth w-full items-center -mx-1 px-1">
          {schema.sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(i)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap min-h-[28px]",
                i === activeSection ? "border-clinical-teal bg-clinical-teal text-paper shadow-sm" : "border-ink/15 text-ink-soft hover:bg-ink/5"
              )}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap w-full box-border">
        {allNodesInSection.map((n) => renderNode(n, values, setValue, runtime.fields, errors, mode))}
      </div>

      {mode === "fill" && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-t border-ink/10 pt-4 dark:border-white/10 w-full">
          <div className="w-full sm:w-auto order-2 sm:order-1">
            {activeSection > 0 && (
              <Button type="button" variant="outline" onClick={() => setActiveSection((s) => s - 1)} className="w-full sm:w-auto h-9 text-xs sm:text-sm">
                Previous Section
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button type="button" variant="ghost" disabled={submitting} onClick={(e) => handleSubmit(e as any, true)} className="h-9 text-xs sm:text-sm py-1.5">
              Save Draft
            </Button>
            {!isLastSection ? (
              <Button type="button" onClick={() => setActiveSection((s) => s + 1)} className="h-9 text-xs sm:text-sm py-1.5">
                Next Section
              </Button>
            ) : (
              <Button type="submit" disabled={submitting} className="h-9 text-xs sm:text-sm py-1.5">
                {submitting ? "Submitting…" : "Submit Final Form"}
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}