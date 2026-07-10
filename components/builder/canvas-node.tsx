"use client";

import * as React from "react";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Copy, Trash2, ClipboardCopy } from "lucide-react";
import { FieldRenderer, widthClass } from "@/components/renderer/field-renderer";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { isLayoutType } from "@/lib/form-engine/field-registry";
import { rectToGridStyle, GRID_COLUMNS, SPAN_TO_WIDTH, SNAP_SPANS, type GridRect } from "@/lib/form-engine/grid-engine";
import { useFlipAnimation } from "@/lib/form-engine/use-flip-animation";
import { cn } from "@/lib/utils/cn";
import type { FormComponentNode } from "@/lib/form-engine/types";

function nearestSpan(target: number): number {
  return SNAP_SPANS.reduce((best, span) => (Math.abs(span - target) < Math.abs(best - target) ? span : best), SNAP_SPANS[0]);
}

export function CanvasNode({
  node,
  sectionId,
  rect,
  isGhost,
}: {
  node: FormComponentNode;
  sectionId: string;
  rect: GridRect;
  isGhost: boolean;
}) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);
  const removeComponent = useBuilderStore((s) => s.removeComponent);
  const duplicateComponent = useBuilderStore((s) => s.duplicateComponent);
  const copyComponent = useBuilderStore((s) => s.copyComponent);
  const setComponentWidth = useBuilderStore((s) => s.setComponentWidth);

  const isSelected = selectedId === node.id;
  
  // Convert standard sorting handlers into absolute draggable targets
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: node.id });

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  useFlipAnimation(wrapperRef as React.RefObject<HTMLElement | null>, `${rect.x}-${rect.y}-${rect.w}-${rect.h}`);

  const setRefs = React.useCallback((el: HTMLDivElement | null) => {
    (wrapperRef as any).current = el;
    setNodeRef(el);
  }, [setNodeRef]);

  const [resizePreviewSpan, setResizePreviewSpan] = React.useState<number | null>(null);
  const resizeStart = React.useRef<{ startX: number; startSpan: number; colWidth: number } | null>(null);

  function handleResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const container = wrapperRef.current?.closest("[data-grid-columns]") as HTMLElement | null;
    const colWidth = container ? container.getBoundingClientRect().width / GRID_COLUMNS : 64;
    resizeStart.current = { startX: e.clientX, startSpan: rect.w, colWidth };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleResizePointerMove(e: React.PointerEvent) {
    if (!resizeStart.current) return;
    const { startX, startSpan, colWidth } = resizeStart.current;
    const deltaCols = (e.clientX - startX) / colWidth;
    const rawSpan = Math.max(2, Math.min(GRID_COLUMNS, Math.round(startSpan + deltaCols)));
    setResizePreviewSpan(nearestSpan(rawSpan));
  }

  function handleResizePointerUp() {
    if (!resizeStart.current) return;
    if (resizePreviewSpan && resizePreviewSpan !== rect.w) {
      const preset = SPAN_TO_WIDTH[resizePreviewSpan] ?? "full";
      setComponentWidth(sectionId, node.id, preset);
    }
    resizeStart.current = null;
    setResizePreviewSpan(null);
  }

  const gridStyle = resizePreviewSpan
    ? rectToGridStyle({ ...rect, w: resizePreviewSpan })
    : rectToGridStyle(rect);

  return (
    <div
      ref={setRefs}
      style={{
        ...gridStyle,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isGhost ? 0 : isSelected ? 30 : 10,
      }}
      className={cn("transform-gpu box-border w-full h-full p-0.5", isGhost && "opacity-25")}
    >
      <div
        onClick={(e) => { e.stopPropagation(); select(node.id); }}
        className={cn(
          "group relative h-full w-full rounded-md border bg-white p-3.5 transition-all duration-150 dark:bg-paper-darkdim shadow-xs",
          isSelected 
            ? "border-clinical-teal ring-1 ring-clinical-teal/20 shadow-md" 
            : "border-ink/10 hover:border-ink/20 dark:border-white/10"
        )}
      >
        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
          <button {...attributes} {...listeners} className="cursor-grab touch-none rounded bg-white border border-ink/10 p-1 text-ink/30 hover:text-ink active:cursor-grabbing shadow-xs dark:bg-paper-dark">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-20">
          <button onClick={(e) => { e.stopPropagation(); copyComponent(node.id); }} title="Copy" className="rounded p-1 hover:bg-ink/5 dark:hover:bg-white/10 text-ink-soft"><ClipboardCopy className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); duplicateComponent(node.id); }} title="Duplicate" className="rounded p-1 hover:bg-ink/5 dark:hover:bg-white/10 text-ink-soft"><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); removeComponent(node.id); }} title="Delete" className="rounded p-1 hover:bg-clinical-brick/10 text-clinical-brick"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>

        {isLayoutType(node.type) ? (
          <div className="w-full">
            <p className="stamp mb-1 text-[9px] font-bold text-clinical-sage">{node.label} · {node.type}</p>
            <div className="flex flex-col gap-2 rounded-xs border border-dashed border-ink/15 p-2 bg-ink/[0.01]">
              {(node.children ?? []).map((child) => (
                <div key={child.id} className="pointer-events-none select-none opacity-60">
                  <FieldRenderer node={child} value={undefined} onChange={() => {}} interactive={false} />
                </div>
              ))}
              {(node.children ?? []).length === 0 && <span className="text-[11px] text-ink-soft/40">Container empty</span>}
            </div>
          </div>
        ) : (
          <div className="w-full h-full pointer-events-none select-none">
            <FieldRenderer node={node} value={undefined} onChange={() => {}} interactive={false} />
          </div>
        )}

        {isSelected && (
          <div
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            className="absolute -right-1 top-1/2 h-7 w-2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border border-clinical-teal bg-white shadow-md hover:scale-110 transition-transform active:bg-clinical-teal"
            title="Drag right edge to change column width span"
          />
        )}
      </div>
    </div>
  );
}