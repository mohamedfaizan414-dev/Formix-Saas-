"use client";

import * as React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import * as Icons from "lucide-react";
import { BuilderSidebar } from "./sidebar";
import { BuilderCanvas } from "./canvas";
import { PropertyPanel } from "./property-panel";
import { BuilderToolbar } from "./toolbar";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { FIELD_REGISTRY } from "@/lib/form-engine/field-registry";
import type { FormSchema } from "@/lib/form-engine/types";

type MobilePane = "fields" | "canvas" | "properties";

export function BuilderShell({ formId, status, initialSchema }: { formId: string; status: string; initialSchema: FormSchema }) {
  const setSchema = useBuilderStore((s) => s.setSchema);
  const schema = useBuilderStore((s) => s.schema);
  const activeSectionId = useBuilderStore((s) => s.activeSectionId);
  const addComponent = useBuilderStore((s) => s.addComponent);
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const [activeDragType, setActiveDragType] = React.useState<string | null>(null);

  // Mobile-only: which single pane is visible. Desktop ignores this entirely.
  const [mobilePane, setMobilePane] = React.useState<MobilePane>("canvas");
  const selectedComponentId = useBuilderStore((s) => (s as any).selectedComponentId);

  React.useEffect(() => {
    setSchema(initialSchema);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  // Auto-jump to the Properties pane on mobile whenever a component gets selected,
  // so tapping a field on canvas naturally reveals its settings without an extra tap.
  React.useEffect(() => {
    if (selectedComponentId) setMobilePane("properties");
  }, [selectedComponentId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current as any;
    setActiveDragType(data?.fieldType ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDragType(null);
    const { active, over } = e;
    if (!over) return;

    const activeData = active.data.current as any;

    if (activeData?.source === "palette") {
      const fieldType = activeData.fieldType as keyof typeof FIELD_REGISTRY;
      const def = FIELD_REGISTRY[fieldType];
      if (!def) return;
      const section = schema.sections.find((s) => s.id === activeSectionId) ?? schema.sections[0];
      addComponent(section.id, def.createNode());
      // On mobile, adding a field from the palette should jump the user to the canvas
      // so they can immediately see/arrange what they just added.
      setMobilePane("canvas");
      return;
    }

    // reordering existing top-level nodes
    if (active.id !== over.id) {
      const section = schema.sections.find((s) => s.components.some((c) => c.id === active.id));
      if (section) moveComponent(String(active.id), String(over.id), section.id);
    }
  }

  const Icon = activeDragType ? (Icons as any)[FIELD_REGISTRY[activeDragType as keyof typeof FIELD_REGISTRY]?.icon] : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col">
        <BuilderToolbar formId={formId} status={status} />

        {/* Mobile-only pane switcher. Hidden entirely on md+ so desktop is untouched. */}
        <div className="flex border-b border-border bg-white dark:bg-paper-darkdim md:hidden">
          {(
            [
              { key: "fields", label: "Fields" },
              { key: "canvas", label: "Canvas" },
              { key: "properties", label: "Properties" },
            ] as { key: MobilePane; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMobilePane(tab.key)}
              className={`flex-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                mobilePane === tab.key
                  ? "border-clinical-teal text-clinical-teal"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar: full width on mobile when active tab, fixed column on desktop */}
          <div
            className={`min-h-0 w-full overflow-y-auto md:block md:w-auto md:flex-none ${
              mobilePane === "fields" ? "block" : "hidden"
            }`}
          >
            <BuilderSidebar />
          </div>

          {/* Canvas: full width on mobile when active tab, flexible middle column on desktop */}
          <div
            className={`min-h-0 w-full min-w-0 overflow-y-auto md:block md:flex-1 ${
              mobilePane === "canvas" ? "block" : "hidden"
            }`}
          >
            <BuilderCanvas />
          </div>

          {/* Property panel: full width on mobile when active tab, fixed column on desktop */}
          <div
            className={`min-h-0 w-full overflow-y-auto md:block md:w-auto md:flex-none ${
              mobilePane === "properties" ? "block" : "hidden"
            }`}
          >
            <PropertyPanel />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragType && Icon ? (
          <div className="flex items-center gap-2 rounded-xs border border-clinical-teal bg-white px-3 py-2 text-sm shadow-panel dark:bg-paper-darkdim">
            <Icon className="h-4 w-4 text-clinical-teal" /> {FIELD_REGISTRY[activeDragType as keyof typeof FIELD_REGISTRY]?.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}