"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import * as Icons from "lucide-react";
import { ALL_CATEGORIES, CATEGORY_LABELS, getFieldsByCategory, isLayoutType } from "@/lib/form-engine/field-registry";
import type { FieldDefinition } from "@/lib/form-engine/field-registry";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { cn } from "@/lib/utils/cn";

function PaletteItem({ field }: { field: FieldDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.type}`,
    data: { source: "palette", fieldType: field.type },
  });
  const Icon = (Icons as any)[field.icon] ?? Icons.Square;
  const addComponent = useBuilderStore((s) => s.addComponent);
  const activeSectionId = useBuilderStore((s) => s.activeSectionId);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const schema = useBuilderStore((s) => s.schema);

  const selectedNode = React.useMemo(() => {
    const search = (nodes: any[]): any => {
      for (const n of nodes) {
        if (n.id === selectedId) return n;
        if (n.children) { const r = search(n.children); if (r) return r; }
      }
      return null;
    };
    for (const s of schema.sections) { const r = search(s.components); if (r) return r; }
    return null;
  }, [schema, selectedId]);

  function handleClick() {
    const node = field.createNode();
    const parentId = selectedNode && isLayoutType(selectedNode.type) ? selectedNode.id : undefined;
    addComponent(activeSectionId, node, parentId);
  }

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      title={field.description}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-xs border border-transparent px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:border-ink/10 hover:bg-white dark:text-white/60 dark:hover:bg-white/5",
        isDragging && "opacity-40"
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-clinical-sagelight text-clinical-tealdeep group-hover:bg-clinical-sage/25">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      {field.label}
    </button>
  );
}

export function BuilderSidebar() {
  const [query, setQuery] = React.useState("");

  return (
   <aside className="flex h-full w-full shrink-0 flex-col border-r border-ink/10 bg-paper-dim dark:border-white/10 dark:bg-paper-darkdim md:w-72">
      <div className="border-b border-ink/10 p-3 dark:border-white/10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components…"
          className="h-9 w-full rounded-xs border border-ink/15 bg-white px-3 text-sm outline-none focus:border-clinical-sage dark:border-white/15 dark:bg-paper-dark"
        />
      </div>
      <div className="thin-scroll flex-1 overflow-y-auto p-3">
        {ALL_CATEGORIES.map((cat) => {
          const fields = getFieldsByCategory(cat).filter((f) =>
            f.label.toLowerCase().includes(query.toLowerCase())
          );
          if (!fields.length) return null;
          return (
            <div key={cat} className="mb-5">
              <p className="stamp mb-2 px-1 text-[10px] text-clinical-sage">{CATEGORY_LABELS[cat]}</p>
              <div className="space-y-0.5">
                {fields.map((f) => <PaletteItem key={f.type} field={f} />)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="border-t border-ink/10 p-3 text-[11px] text-ink-soft/70 dark:border-white/10 dark:text-white/30">
        Click to add to the canvas, or drag onto a section. Select a layout container first to nest a field inside it.
      </p>
    </aside>
  );
}