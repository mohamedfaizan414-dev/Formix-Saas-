"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2, ClipboardCopy, ChevronUp, ChevronDown } from "lucide-react";
import { FieldRenderer } from "@/components/renderer/field-renderer";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { isLayoutType } from "@/lib/form-engine/field-registry";
import { cn } from "@/lib/utils/cn";
import type { FormComponentNode } from "@/lib/form-engine/types";

function ChildNode({ node, sectionId }: { node: FormComponentNode; sectionId: string }) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);
  const removeComponent = useBuilderStore((s) => s.removeComponent);
  const isSelected = selectedId === node.id;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); select(node.id); }}
      className={cn(
        "group/child relative cursor-pointer rounded-xs border border-dashed border-ink/15 p-2 transition-colors duration-200 ease-out",
        isSelected && "border-solid border-clinical-brick bg-clinical-bricklight/20"
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); removeComponent(node.id); }}
        className="absolute right-1 top-1 rounded p-0.5 opacity-0 transition-opacity duration-150 hover:bg-clinical-brick/10 group-hover/child:opacity-100"
      >
        <Trash2 className="h-3 w-3 text-clinical-brick" />
      </button>
      {isLayoutType(node.type) ? (
        <LayoutBody node={node} sectionId={sectionId} nested />
      ) : (
        <FieldRenderer node={node} value={undefined} onChange={() => {}} interactive={false} />
      )}
    </div>
  );
}

function LayoutBody({ node, sectionId, nested }: { node: FormComponentNode; sectionId: string; nested?: boolean }) {
  const children = node.children ?? [];
  return (
    <div>
      <p className="stamp mb-2 text-[10px] text-clinical-sage">{node.label} · {node.type}</p>
      <div className={cn("grid gap-2", node.type === "row" ? "grid-cols-2" : "grid-cols-1", children.length === 0 && "min-h-[48px] place-items-center rounded-xs border border-dashed border-ink/15")}>
        {children.length === 0 && <span className="text-xs text-ink-soft/50">Select this container, then click a field in the sidebar</span>}
        {children.map((child) => <ChildNode key={child.id} node={child} sectionId={sectionId} />)}
      </div>
    </div>
  );
}

export function CanvasNode({ node, sectionId }: { node: FormComponentNode; sectionId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    transition: {
      duration: 250,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  });
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);
  const removeComponent = useBuilderStore((s) => s.removeComponent);
  const duplicateComponent = useBuilderStore((s) => s.duplicateComponent);
  const copyComponent = useBuilderStore((s) => s.copyComponent);

  const isSelected = selectedId === node.id;

  // Positional transform only — must stay instantaneous while dragging so it
  // tracks the pointer 1:1. Easing lives on the drop/settle transition dnd-kit
  // provides, not here.
  const positionStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: "transform",
  };

  return (
    <div ref={setNodeRef} style={positionStyle} className="transform-gpu">
      {/* Inner layer owns the "lift" (scale/shadow) feedback with its own
          eased transition, fully decoupled from the drag-tracking transform
          above so the two never fight or snap. */}
      <div
        onClick={(e) => { e.stopPropagation(); select(node.id); }}
        className={cn(
          "group relative origin-center rounded-md border bg-white p-4 transition-all duration-200 ease-out transform-gpu dark:bg-paper-darkdim",
          isSelected ? "border-clinical-brick shadow-[0_0_0_2px_rgba(178,76,50,0.15)]" : "border-ink/10 hover:border-ink/20 dark:border-white/10",
          isDragging
            ? "scale-[1.025] cursor-grabbing opacity-95 shadow-2xl shadow-black/20"
            : "scale-100 shadow-none"
        )}
      >
        <div className="absolute -left-3 top-1/2 hidden -translate-y-1/2 md:block">
          <button {...attributes} {...listeners} className="cursor-grab rounded bg-ink/5 p-1 text-ink/40 transition-colors duration-150 hover:text-ink active:cursor-grabbing dark:bg-white/5">
            <GripVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); copyComponent(node.id); }} title="Copy" className="rounded p-1 transition-colors duration-150 hover:bg-ink/5 dark:hover:bg-white/10"><ClipboardCopy className="h-3.5 w-3.5 text-ink-soft" /></button>
          <button onClick={(e) => { e.stopPropagation(); duplicateComponent(node.id); }} title="Duplicate" className="rounded p-1 transition-colors duration-150 hover:bg-ink/5 dark:hover:bg-white/10"><Copy className="h-3.5 w-3.5 text-ink-soft" /></button>
          <button onClick={(e) => { e.stopPropagation(); removeComponent(node.id); }} title="Delete" className="rounded p-1 transition-colors duration-150 hover:bg-clinical-brick/10"><Trash2 className="h-3.5 w-3.5 text-clinical-brick" /></button>
        </div>

        {isLayoutType(node.type) ? (
          <LayoutBody node={node} sectionId={sectionId} />
        ) : (
          <FieldRenderer node={node} value={undefined} onChange={() => {}} interactive={false} />
        )}
      </div>
    </div>
  );
}