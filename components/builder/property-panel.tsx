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
  const isTypography = ["heading", "paragraph", "label"].includes(node.type);

  const patch = (p: Partial<FormComponentNode>) => updateComponent(node.id, p);
  const patchValidation = (p: Partial<FormComponentNode["validation"]>) => patch({ validation: { ...node.validation, ...p } });
  const patchDisplay = (p: Partial<FormComponentNode["display"]>) => patch({ display: { ...node.display, ...p } });
  const patchMeta = (p: Record<string, unknown>) => patch({ meta: { ...node.meta, ...p } });

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
            {!isLayout && !isTypography && <TabsTrigger value="validation">Validation</TabsTrigger>}
          </TabsList>
        </Tabs>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{isTypography ? "Text Content" : "Field label"}</Label>
                <Input value={node.label ?? ""} onChange={(e) => patch({ label: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Internal name</Label>
                <Input value={node.internalName} onChange={(e) => patch({ internalName: e.target.value })} className="font-mono text-xs" />
              </div>
              {!isLayout && !isTypography && (
                <div className="space-y-1.5">
                  <Label>Placeholder</Label>
                  <Input value={node.placeholder ?? ""} onChange={(e) => patch({ placeholder: e.target.value })} />
                </div>
              )}
              {!isTypography && (
                <div className="space-y-1.5">
                  <Label>Help text</Label>
                  <Textarea rows={2} value={node.helpText ?? ""} onChange={(e) => patch({ helpText: e.target.value })} />
                </div>
              )}
              {node.type === "consent" && (
      <div className="space-y-1.5">
        <Label>Consent Description Text</Label>
        <Textarea 
          rows={3} 
          value={node.description ?? ""} 
          onChange={(e) => patch({ description: e.target.value })} 
          placeholder="Enter the terms or acknowledgement text the user must check..."
        />
      </div>
    )}
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
            </div>
          </TabsContent>

          <TabsContent value="display">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Width Slot</Label>
            

  <Select value={node.display?.width ?? "full"} onChange={(e) => patchDisplay({ width: e.target.value as any })}>
    <option value="full">Full width (100%)</option>
    <option value="three-quarters">Three-Quarters (75%)</option> {/* 🌟 Added */}
    <option value="two-thirds">Two-Thirds (66.6%)</option>      {/* 🌟 Added */}
    <option value="half">Half width (50%)</option>
    <option value="third">Third width (33.3%)</option>
    <option value="quarter">Quarter width (25%)</option>
    <option value="sixth">Sixth width (16.6%)</option>
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

              {/* Advanced Text Customizer Sub-section */}
              {isTypography && (
                <>
                  <div className="space-y-1.5">
                    <Label>Font Scale size</Label>
                    <Select value={(node.meta?.fontSize as string) ?? "base"} onChange={(e) => patchMeta({ fontSize: e.target.value })}>
                      <option value="xs">Extra Small</option>
                      <option value="sm">Small</option>
                      <option value="base">Normal (Base)</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large (Heading size)</option>
                      <option value="2xl">2X Large</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Font Weight</Label>
                    <Select value={(node.meta?.fontWeight as string) ?? "normal"} onChange={(e) => patchMeta({ fontWeight: e.target.value })}>
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Font Family</Label>
                    <Select value={(node.meta?.fontFamily as string) ?? "sans"} onChange={(e) => patchMeta({ fontFamily: e.target.value })}>
                      <option value="sans">Sans (Default)</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                      <option value="display">Display</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Text Color</Label>
                    <Select value={(node.meta?.textColor as string) ?? "default"} onChange={(e) => patchMeta({ textColor: e.target.value })}>
                      <option value="default">Default Ink</option>
                      <option value="teal">Clinical Teal</option>
                      <option value="sage">Clinical Sage</option>
                      <option value="brick">Clinical Brick</option>
                      <option value="soft">Soft Gray</option>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Accent border color</Label>
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

          {!isLayout && !isTypography && (
            <TabsContent value="validation">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Required</Label>
                  <Switch checked={!!node.validation?.required} onCheckedChange={(v) => patchValidation({ required: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Read only</Label>
                  <Switch checked={!!node.validation?.readOnly} onCheckedChange={(v) => patchValidation({ readOnly: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Hidden</Label>
                  <Switch checked={!!node.validation?.hidden} onCheckedChange={(v) => patchValidation({ hidden: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="normal-case tracking-normal">Disabled</Label>
                  <Switch checked={!!node.validation?.disabled} onCheckedChange={(v) => patchValidation({ disabled: v })} />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </aside>
  );
}