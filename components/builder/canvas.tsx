// components/builder/canvas.tsx
"use client";

import * as React from "react";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { Plus, Trash2 } from "lucide-react";
import { CanvasNode } from "./canvas-node";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { packGrid, pixelToCell, findInsertionIndex, type Cell } from "@/lib/form-engine/grid-engine";
import { cn } from "@/lib/utils/cn";
function GridBackground({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 grid grid-cols-12 gap-4",
        active ? "bg-clinical-sagelight/10" : ""
      )}
    >
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="border-r border-dashed border-ink/10 last:border-none" />
      ))}
    </div>
  );
}

function InsertionIndicator({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  return (
    <div
      className="pointer-events-none rounded border border-clinical-teal/60 bg-clinical-teal/10"
      style={{
        gridColumnStart: x + 1,
        gridColumnEnd: `span ${w}`,
        gridRowStart: y + 1,
        gridRowEnd: `span ${h}`,
      }}
    />
  );
}
export function BuilderCanvas() {
  const schema = useBuilderStore((s) => s.schema);
  const activeSectionId = useBuilderStore((s) => s.activeSectionId);
  const setActiveSectionId = useBuilderStore((s) => s.setActiveSectionId);
  const addSection = useBuilderStore((s) => s.addSection);
  const removeSection = useBuilderStore((s) => s.removeSection);
  const renameSection = useBuilderStore((s) => s.renameSection);
  const select = useBuilderStore((s) => s.select);
  const reorderComponent = useBuilderStore((s) => s.reorderComponent);

  const activeSection = schema.sections.find((s) => s.id === activeSectionId) ?? schema.sections[0];
  const { setNodeRef, isOver } = useDroppable({ id: `canvas-${activeSection.id}`, data: { sectionId: activeSection.id } });

  const gridRef = React.useRef<HTMLDivElement>(null);
  const [pointerCell, setPointerCell] = React.useState<Cell | null>(null);

  const lastInsertionRef = React.useRef<{ sectionId: string; nodeId: string; index: number } | null>(null);

  const layout = React.useMemo(() => packGrid(activeSection.components), [activeSection.components]);

  const dndContext = useDndContext();
  const activeDragId = dndContext.active?.id;

  React.useEffect(() => {
    if (!activeDragId || !gridRef.current) {
      setPointerCell(null);
      return;
    }

    function handlePointerMove(e: PointerEvent) {
      if (!gridRef.current) return;
      const containerRect = gridRef.current.getBoundingClientRect();
      const cell = pixelToCell(e.clientX, e.clientY, containerRect);
      setPointerCell(cell);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [activeDragId]);

  const insertion = React.useMemo(() => {
    if (!activeDragId || !pointerCell) return null;
    
    let dragNode = activeSection.components.find((c) => c.id === activeDragId);
    
    // 🌟 FIXED: If the item is incoming from the sidebar palette, create a mock node
    // so the Skyline packer can accurately preview where it will insert.
    if (!dragNode) {
      const activeData = dndContext.active?.data.current as any;
      if (activeData?.source === "palette") {
        dragNode = {
          id: String(activeDragId),
          type: activeData.fieldType,
          label: "Preview",
          internalName: "preview",
          display: { width: "full" },
        } as any;
      }
    }

    if (!dragNode) return null;

    const targetIdx = findInsertionIndex(activeSection.components, layout, pointerCell, String(activeDragId));
    const reorderedNodes = activeSection.components.filter((c) => c.id !== activeDragId);
    reorderedNodes.splice(targetIdx, 0, dragNode);
    
    const previewLayout = packGrid(reorderedNodes);
    return { rect: previewLayout.positions.get(String(activeDragId)), index: targetIdx };
  }, [activeDragId, pointerCell, activeSection.components, layout, dndContext.active]);

  if (activeDragId && insertion) {
    const isPalette = dndContext.active?.data.current?.source === "palette";
    
    if (!isPalette) {
      lastInsertionRef.current = {
        sectionId: activeSection.id,
        nodeId: String(activeDragId),
        index: insertion.index
      };
    }
    
    // 🌟 FIXED: Expose the calculated index globally so BuilderShell can read it instantly on drop
    (window as any)._lastGridInsertionIndex = insertion.index;
  }

  React.useEffect(() => {
    if (!activeDragId && lastInsertionRef.current) {
      const { sectionId, nodeId, index } = lastInsertionRef.current;
      reorderComponent(sectionId, nodeId, index);
      lastInsertionRef.current = null;
      (window as any)._lastGridInsertionIndex = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDragId]);

  return (
    <div className="thin-scroll flex h-full flex-1 flex-col overflow-y-auto bg-paper-dim dark:bg-paper-dark">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-ink/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-paper-darkdim z-20">
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

      <div className="flex-1 p-4 md:p-6 w-full">
        <div
          ref={(el) => {
            setNodeRef(el);
            (gridRef as any).current = el;
          }}
          onClick={() => select(null)}
          data-grid-columns={12}
          className={cn(
            "chart-paper relative mx-auto w-full max-w-3xl min-h-[600px] rounded-md border-2 border-dashed p-4 transition-all duration-300 ease-out grid content-start gap-4",
            isOver ? "border-clinical-sage bg-clinical-sagelight/5" : "border-ink/10 dark:border-white/10"
          )}
          style={{
            gridTemplateColumns: `repeat(12, minmax(0, 1fr))`,
            gridAutoRows: `minmax(90px, auto)`
          }}
        >
          <GridBackground active={!!activeDragId} />

          {insertion?.rect && (
            <InsertionIndicator 
              x={insertion.rect.x} 
              y={insertion.rect.y} 
              w={insertion.rect.w} 
              h={insertion.rect.h} 
            />
          )}

          {activeSection.components.map((node) => {
            const rect = layout.positions.get(node.id);
            if (!rect) return null;
            return (
              <CanvasNode
                key={node.id}
                node={node}
                sectionId={activeSection.id}
                rect={rect}
                isGhost={activeDragId === node.id}
              />
            );
          })}

          {activeSection.components.length === 0 && !activeDragId && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <p className="stamp text-xs text-clinical-sage">Canvas workspace surface empty</p>
              <p className="mt-2 max-w-xs text-xs text-ink-soft/60">Drag input fields from the sidebar configuration panel to arrange the canvas layer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}