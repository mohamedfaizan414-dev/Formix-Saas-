"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface Token {
  type: "text" | "input" | "dropdown";
  value?: string;
  key?: string;
  placeholder?: string;
  options?: string[];
}

interface InlineTemplateRendererProps {
  node: {
    label?: string;
    internalName: string;
    config?: {
      tokens?: Token[];
    };
  };
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  disabled?: boolean;
}

export function InlineTemplateRenderer({ node, value = {}, onChange, disabled }: InlineTemplateRendererProps) {
  function handleInnerValueMutation(fieldKey: string, nestedValue: string) {
    onChange({
      ...value,
      [fieldKey]: nestedValue,
    });
  }

  return (
    <div className="w-full rounded-md border border-ink/10 bg-white p-5 dark:border-white/10 dark:bg-paper-darkdim shadow-panel space-y-2">
      {node.label && (
        <h5 className="text-xs font-bold text-clinical-sage uppercase tracking-wider mb-2">
          {node.label.replace(/<[^>]*>/g, "")}
        </h5>
      )}
      
      {/* Dynamic Inline Wrapping Text Frame */}
      <div className="flex flex-wrap items-center gap-y-3 gap-x-1.5 text-sm leading-relaxed text-ink dark:text-white">
        {node.config?.tokens?.map((token, index) => {
          switch (token.type) {
            case "text":
              return (
                <span key={index} className="py-1">
                  {token.value}
                </span>
              );

            case "input":
              const inputKey = token.key ?? `blank_${index}`;
              return (
                <input
                  key={index}
                  type="text"
                  disabled={disabled}
                  placeholder={token.placeholder || "___"}
                  value={value[inputKey] ?? ""}
                  onChange={(e) => handleInnerValueMutation(inputKey, e.target.value)}
                  className={cn(
                    "h-8 min-w-[70px] max-w-[160px] inline-block px-2 text-center border-b-2 border-dashed border-ink/20 focus:border-clinical-teal bg-transparent text-sm font-medium outline-none transition-colors",
                    disabled && "opacity-75 cursor-not-allowed border-none font-semibold text-clinical-tealdeep dark:text-white/90"
                  )}
                />
              );

            case "dropdown":
              const selectKey = token.key ?? `select_${index}`;
              if (disabled) {
                return (
                  <span key={index} className="px-1.5 py-0.5 rounded bg-clinical-sagelight text-clinical-tealdeep font-semibold text-xs dark:bg-white/15 dark:text-white">
                    {value[selectKey] || "Unselected"}
                  </span>
                );
              }
              return (
                <select
                  key={index}
                  value={value[selectKey] ?? ""}
                  onChange={(e) => handleInnerValueMutation(selectKey, e.target.value)}
                  className="h-8 inline-block px-1.5 py-0 bg-paper-dim dark:bg-paper-dark border border-ink/10 dark:border-white/15 rounded text-xs font-medium focus:border-clinical-teal outline-none transition-colors"
                >
                  <option value="">Select...</option>
                  {token.options?.map((opt, oIdx) => (
                    <option key={oIdx} value={opt}>{opt}</option>
                  ))}
                </select>
              );

            default:
              return null;
          }
        })}

        {(!node.config?.tokens || node.config.tokens.length === 0) && (
          <span className="text-xs text-ink-soft/30 italic">No template structure rendered.</span>
        )}
      </div>
    </div>
  );
}