"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import { FIELD_REGISTRY, isLayoutType } from "@/lib/form-engine/field-registry";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { FormComponentNode } from "@/lib/form-engine/types";

function findNode(nodes: FormComponentNode[], id: string): FormComponentNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) { const r = findNode(n.children, id); if (r) return r; }
  }
  return null;
}

export function PropertyPanel() {
  const schema = useBuilderStore((s) => s.schema);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const updateComponent = useBuilderStore((s) => s.updateComponent);
  const [tab, setTab] = React.useState("general");

  const node = React.useMemo(() => {
    if (!selectedId) return null;
    for (const s of schema.sections) { const r = findNode(s.components, selectedId); if (r) return r; }
    return null;
  }, [schema, selectedId]);

  if (!node) {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col border-l border-ink/10 bg-paper-dim p-6 dark:border-white/10 dark:bg-paper-darkdim">
        <p className="stamp text-xs text-clinical-sage">Property panel</p>
        <p className="mt-2 text-sm text-ink-soft/70">Select a component on the canvas to configure it.</p>
      </aside>
    );
  }

  const def = FIELD_REGISTRY[node.type];
  const supports = def?.supports ?? {};
  const isLayout = isLayoutType(node.type);

  const patch = (p: Partial<FormComponentNode>) => updateComponent(node.id, p);
  const patchValidation = (p: Partial<FormComponentNode["validation"]>) => patch({ validation: { ...node.validation, ...p } });
  const patchDisplay = (p: Partial<FormComponentNode["display"]>) => patch({ display: { ...node.display, ...p } });

  return (
   <aside className="thin-scroll flex h-full w-full shrink-0 flex-col overflow-y-auto border-l border-ink/10 bg-paper-dim dark:border-white/10 dark:bg-paper-darkdim md:w-80">
      <div className="border-b border-ink/10 p-4 dark:border-white/10">
        <p className="stamp text-[10px] text-clinical-sage">{def?.label ?? node.type}</p>
        <p className="mt-0.5 font-mono text-xs text-ink-soft/60">{node.internalName}</p>
      </div>

      <div className="p-4">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            {!isLayout && <TabsTrigger value="validation">Validation</TabsTrigger>}
          </TabsList>
        </Tabs>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Field label</Label>
                <Input value={node.label ?? ""} onChange={(e) => patch({ label: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Internal name</Label>
                <Input value={node.internalName} onChange={(e) => patch({ internalName: e.target.value })} className="font-mono text-xs" />
              </div>
              {!isLayout && (
                <div className="space-y-1.5">
                  <Label>Placeholder</Label>
                  <Input value={node.placeholder ?? ""} onChange={(e) => patch({ placeholder: e.target.value })} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Help text</Label>
                <Textarea rows={2} value={node.helpText ?? ""} onChange={(e) => patch({ helpText: e.target.value })} />
              </div>

              {supports.orientation && (
                <div className="space-y-1.5">
                  <Label>Orientation</Label>
                  <Select value={node.orientation ?? "vertical"} onChange={(e) => patch({ orientation: e.target.value as any })}>
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </Select>
                </div>
              )}

              {supports.rows && (
                <div className="space-y-1.5">
                  <Label>Rows</Label>
                  <Input type="number" value={(node.meta?.rows as number) ?? 4} onChange={(e) => patch({ meta: { ...node.meta, rows: Number(e.target.value) } })} />
                </div>
              )}

              {supports.options && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {(node.options ?? []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Input
                        value={opt.label}
                        onChange={(e) => {
                          const options = [...(node.options ?? [])];
                          options[i] = { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") };
                          patch({ options });
                        }}
                        className="h-8 text-sm"
                      />
                      <button onClick={() => patch({ options: (node.options ?? []).filter((_, idx) => idx !== i) })} className="rounded p-1 hover:bg-clinical-brick/10">
                        <Trash2 className="h-3.5 w-3.5 text-clinical-brick" />
                      </button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => patch({ options: [...(node.options ?? []), { label: `Option ${(node.options?.length ?? 0) + 1}`, value: `option_${(node.options?.length ?? 0) + 1}` }] })}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add option
                  </Button>
                </div>
              )}

              {supports.fileConfig && (
                <div className="space-y-1.5">
                  <Label>Max size (MB)</Label>
                  <Input type="number" value={(node.meta?.maxSizeMb as number) ?? 10} onChange={(e) => patch({ meta: { ...node.meta, maxSizeMb: Number(e.target.value) } })} />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="display">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Width</Label>
                <Select value={node.display?.width ?? "full"} onChange={(e) => patchDisplay({ width: e.target.value as any })}>
                  <option value="full">Full width</option>
                  <option value="half">Half</option>
                  <option value="third">Third</option>
                  <option value="quarter">Quarter</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Alignment</Label>
                <Select value={node.display?.align ?? "left"} onChange={(e) => patchDisplay({ align: e.target.value as any })}>
                  <option value="left">Left align</option>
                  <option value="center">Center align</option>
                  <option value="right">Right align</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Accent color</Label>
                <Select value={node.display?.colorAccent ?? "none"} onChange={(e) => patchDisplay({ colorAccent: e.target.value as any })}>
                  <option value="none">None</option>
                  <option value="teal">Teal</option>
                  <option value="sage">Sage</option>
                  <option value="brick">Brick</option>
                  <option value="amber">Amber</option>
                </Select>
              </div>
            </div>
          </TabsContent>

          {!isLayout && (
            <TabsContent value="validation">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Required</Label>
                  <Switch checked={!!node.validation.required} onCheckedChange={(v) => patchValidation({ required: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Read only</Label>
                  <Switch checked={!!node.validation.readOnly} onCheckedChange={(v) => patchValidation({ readOnly: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Hidden</Label>
                  <Switch checked={!!node.validation.hidden} onCheckedChange={(v) => patchValidation({ hidden: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Disabled</Label>
                  <Switch checked={!!node.validation.disabled} onCheckedChange={(v) => patchValidation({ disabled: v })} />
                </div>

                {supports.minMaxLength && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5"><Label>Min length</Label><Input type="number" value={node.validation.minLength ?? ""} onChange={(e) => patchValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })} /></div>
                    <div className="space-y-1.5"><Label>Max length</Label><Input type="number" value={node.validation.maxLength ?? ""} onChange={(e) => patchValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })} /></div>
                  </div>
                )}
                {supports.minMax && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5"><Label>Min value</Label><Input type="number" value={node.validation.min ?? ""} onChange={(e) => patchValidation({ min: e.target.value ? Number(e.target.value) : undefined })} /></div>
                    <div className="space-y-1.5"><Label>Max value</Label><Input type="number" value={node.validation.max ?? ""} onChange={(e) => patchValidation({ max: e.target.value ? Number(e.target.value) : undefined })} /></div>
                  </div>
                )}
                {supports.pattern && (
                  <div className="space-y-1.5">
                    <Label>Regex pattern</Label>
                    <Input value={node.validation.pattern ?? ""} onChange={(e) => patchValidation({ pattern: e.target.value })} className="font-mono text-xs" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Validation message</Label>
                  <Input value={node.validation.customMessage ?? ""} onChange={(e) => patchValidation({ customMessage: e.target.value })} />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </aside>
  );
}
