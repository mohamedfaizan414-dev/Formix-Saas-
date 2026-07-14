import * as React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import * as Icons from "lucide-react";
import { BuilderSidebar } from "./sidebar";
import { BuilderCanvas } from "./canvas";
import { PropertyPanel } from "./property-panel";
import { BuilderToolbar } from "./toolbar";
import { useBuilderStore } from "../../lib/form-engine/builder-store";
import { FIELD_REGISTRY } from "../../lib/form-engine/field-registry";

export function BuilderShell({ formId, status, initialSchema, onSaveSuccess }) {
  const setSchema = useBuilderStore((s) => s.setSchema);
  const schema = useBuilderStore((s) => s.schema);
  const activeSectionId = useBuilderStore((s) => s.activeSectionId);
  const addComponent = useBuilderStore((s) => s.addComponent);
  const moveComponent = useBuilderStore((s) => s.moveComponent);
  const [activeDragType, setActiveDragType] = React.useState(null);

  const [mobilePane, setMobilePane] = React.useState("canvas");
  const selectedComponentId = useBuilderStore((s) => s.selectedComponentId);

  React.useEffect(() => {
    setSchema(initialSchema);
  }, [formId]);

  React.useEffect(() => {
    if (selectedComponentId) setMobilePane("properties");
  }, [selectedComponentId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragStart(e) {
    const data = e.active.data.current;
    setActiveDragType(data?.fieldType ?? null);
  }

  function handleDragEnd(e) {
    setActiveDragType(null);
    const { active, over } = e;
    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.source === "palette") {
      const fieldType = activeData.fieldType;
      const def = FIELD_REGISTRY[fieldType];
      if (!def) return;
      const section = schema.sections.find((s) => s.id === activeSectionId) ?? schema.sections[0];

      const gridIndex = window._lastGridInsertionIndex;
      const index = typeof gridIndex === "number" ? gridIndex : undefined;

      addComponent(section.id, def.createNode(), undefined, index);
      
      window._lastGridInsertionIndex = undefined;
      setMobilePane("canvas");
      return;
    }

    if (active.id !== over.id) {
      const section = schema.sections.find((s) => s.components.some((c) => c.id === active.id));
      if (section) moveComponent(String(active.id), String(over.id), section.id);
    }
  }

  const Icon = activeDragType ? Icons[FIELD_REGISTRY[activeDragType]?.icon] : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col">
        <BuilderToolbar formId={formId} status={status} onSaveSuccess={onSaveSuccess} />

        <div className="flex border-b border-border bg-white dark:bg-paper-darkdim md:hidden">
          {[
            { key: "fields", label: "Fields" },
            { key: "canvas", label: "Canvas" },
            { key: "properties", label: "Properties" },
          ].map((tab) => (
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
          <div className={`min-h-0 w-full overflow-y-auto md:block md:w-auto md:flex-none ${mobilePane === "fields" ? "block" : "hidden"}`}>
            <BuilderSidebar />
          </div>

          <div className={`min-h-0 w-full min-w-0 overflow-y-auto md:block md:flex-1 ${mobilePane === "canvas" ? "block" : "hidden"}`}>
            <BuilderCanvas />
          </div>

          <div className={`min-h-0 w-full overflow-y-auto md:block md:w-auto md:flex-none ${mobilePane === "properties" ? "block" : "hidden"}`}>
            <PropertyPanel />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeDragType && Icon ? (
          <div className="flex items-center gap-2 rounded-xs border border-clinical-teal bg-white px-3 py-2 text-sm shadow-panel dark:bg-paper-darkdim">
            <Icon className="h-4 w-4 text-clinical-teal" /> {FIELD_REGISTRY[activeDragType]?.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
