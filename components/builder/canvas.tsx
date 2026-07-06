"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { CanvasNode } from "./canvas-node";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { cn } from "@/lib/utils/cn";

export function BuilderCanvas() {
  const schema = useBuilderStore((s) => s.schema);
  const activeSectionId = useBuilderStore((s) => s.activeSectionId);
  const setActiveSectionId = useBuilderStore((s) => s.setActiveSectionId);
  const addSection = useBuilderStore((s) => s.addSection);
  const removeSection = useBuilderStore((s) => s.removeSection);
  const renameSection = useBuilderStore((s) => s.renameSection);
  const select = useBuilderStore((s) => s.select);

  const activeSection = schema.sections.find((s) => s.id === activeSectionId) ?? schema.sections[0];
  const { setNodeRef, isOver } = useDroppable({ id: `canvas-${activeSection.id}`, data: { sectionId: activeSection.id } });

  return (
    <div className="thin-scroll flex h-full flex-1 flex-col overflow-y-auto bg-paper-dim dark:bg-paper-dark">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-ink/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-paper-darkdim">
  {schema.sections.map((s) => (
    <div key={s.id} className={cn("group flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-colors duration-200 ease-out", s.id === activeSectionId ? "border-clinical-teal bg-clinical-teal/10" : "border-ink/10")}>
      <input
        value={s.title}
        onChange={(e) => renameSection(s.id, e.target.value)}
        onClick={() => setActiveSectionId(s.id)}
        className="w-28 bg-transparent text-xs font-medium outline-none"
      />
      {schema.sections.length > 1 && (
        <button onClick={() => removeSection(s.id)} className="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Trash2 className="h-3 w-3 text-clinical-brick" />
        </button>
      )}
    </div>
  ))}
  <button onClick={addSection} className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-ink/20 px-3.5 py-1.5 text-xs text-ink-soft transition-colors duration-150 hover:border-clinical-sage hover:text-clinical-teal">
    <Plus className="h-3 w-3" /> Section
  </button>
</div>

      <div
        ref={setNodeRef}
        onClick={() => select(null)}
      className={cn(
  "chart-paper mx-auto my-4 w-full max-w-3xl flex-1 origin-center space-y-4 rounded-md border-2 border-dashed p-4 transition-all duration-300 ease-out transform-gpu md:my-8 md:p-6",
  isOver ? "scale-[1.004] border-clinical-sage bg-clinical-sagelight/20" : "scale-100 border-ink/10 dark:border-white/10"
)}
      >
        <SortableContext items={activeSection.components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {activeSection.components.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="stamp text-xs text-clinical-sage">Section is empty</p>
              <p className="mt-2 max-w-xs text-sm text-ink-soft/70">Drag a component from the sidebar, or click one to drop it in here.</p>
            </div>
          ) : (
            activeSection.components.map((node) => <CanvasNode key={node.id} node={node} sectionId={activeSection.id} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}