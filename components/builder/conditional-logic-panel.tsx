"use client";

import * as React from "react";
import { nanoid } from "nanoid";
import { Plus, Trash2, Zap } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "@/lib/form-engine/builder-store";
import type { ConditionalRule, ConditionRule, FormComponentNode } from "@/lib/form-engine/types";

function flattenFields(schema: ReturnType<typeof useBuilderStore.getState>["schema"]): FormComponentNode[] {
  const out: FormComponentNode[] = [];
  const walk = (nodes: FormComponentNode[]) => {
    for (const n of nodes) {
      if (!["section", "card", "row", "column", "accordion", "tabs"].includes(n.type)) out.push(n);
      if (n.children) walk(n.children);
    }
  };
  schema.sections.forEach((s) => walk(s.components));
  return out;
}

const OPERATORS: { value: ConditionRule["operator"]; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "notEquals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "greaterThan", label: "is greater than" },
  { value: "lessThan", label: "is less than" },
  { value: "greaterOrEqual", label: "is at least" },
  { value: "lessOrEqual", label: "is at most" },
  { value: "isEmpty", label: "is empty" },
  { value: "isNotEmpty", label: "is not empty" },
];

const ACTIONS: { value: ConditionalRule["action"]; label: string }[] = [
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
  { value: "enable", label: "Enable" },
  { value: "disable", label: "Disable" },
  { value: "require", label: "Make required" },
  { value: "unrequire", label: "Make optional" },
];

function newRule(): ConditionalRule {
  return {
    id: nanoid(8),
    name: "New rule",
    when: { id: nanoid(8), combinator: "AND", rules: [{ id: nanoid(8), field: "", operator: "equals", value: "" }] },
    action: "show",
    targetFieldIds: [],
  };
}

export function ConditionalLogicButton() {
  const [open, setOpen] = React.useState(false);
  const schema = useBuilderStore((s) => s.schema);
  const setConditionalRules = useBuilderStore((s) => s.setConditionalRules);
  const fields = React.useMemo(() => flattenFields(schema), [schema]);
  const [rules, setRules] = React.useState<ConditionalRule[]>(schema.conditionalRules);

  React.useEffect(() => setRules(schema.conditionalRules), [open]); // eslint-disable-line

  function addRule() {
    setRules((r) => [...r, newRule()]);
  }
  function updateRule(id: string, patch: Partial<ConditionalRule>) {
    setRules((r) => r.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }
  function updateCondition(ruleId: string, condIndex: number, patch: Partial<ConditionRule>) {
    setRules((r) =>
      r.map((rule) => {
        if (rule.id !== ruleId) return rule;
        const nextConds = [...rule.when.rules] as ConditionRule[];
        nextConds[condIndex] = { ...nextConds[condIndex], ...patch };
        return { ...rule, when: { ...rule.when, rules: nextConds } };
      })
    );
  }
  function addCondition(ruleId: string) {
    setRules((r) =>
      r.map((rule) =>
        rule.id === ruleId
          ? { ...rule, when: { ...rule.when, rules: [...rule.when.rules, { id: nanoid(8), field: "", operator: "equals", value: "" }] } }
          : rule
      )
    );
  }
  function removeRule(id: string) {
    setRules((r) => r.filter((rule) => rule.id !== id));
  }

  function save() {
    setConditionalRules(rules);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Zap className="h-3.5 w-3.5" /> Conditional logic ({schema.conditionalRules.length})
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Conditional logic rules" className="max-w-2xl">
        <div className="thin-scroll max-h-[55vh] space-y-5 overflow-y-auto pr-1">
   {rules.map((rule) => (
            <div key={rule.id} className="rounded-md border border-ink/10 p-4 dark:border-white/10">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Input value={rule.name ?? ""} onChange={(e) => updateRule(rule.id, { name: e.target.value })} className="h-8 max-w-[220px] text-sm font-medium" />
                <button onClick={() => removeRule(rule.id)} className="rounded p-1 hover:bg-clinical-brick/10">
                  <Trash2 className="h-4 w-4 text-clinical-brick" />
                </button>
              </div>

              <div className="mb-1.5 flex items-center gap-2">
                <p className="stamp text-[10px] text-clinical-sage">Match conditions:</p>
                <Select 
                  value={rule.when.combinator} 
                  onChange={(e) => updateRule(rule.id, { when: { ...rule.when, combinator: e.target.value as "AND" | "OR" } })}
                  className="h-6 w-20 px-2 py-0 text-xs"
                >
                  <option value="AND">All (AND)</option>
                  <option value="OR">Any (OR)</option>
                </Select>
              </div>
              
              <div className="space-y-2">
                {rule.when.rules.map((c, i) => {
                  const cond = c as ConditionRule;
                  return (
                    <div key={cond.id} className="grid grid-cols-3 gap-2">
                      <Select value={cond.field} onChange={(e) => updateCondition(rule.id, i, { field: e.target.value })} className="h-8 text-xs">
                        <option value="">Field…</option>
                        {fields.map((f) => <option key={f.id} value={f.internalName}>{f.label || f.internalName}</option>)}
                      </Select>
                      <Select value={cond.operator} onChange={(e) => updateCondition(rule.id, i, { operator: e.target.value as any })} className="h-8 text-xs">
                        {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                      <Input value={(cond.value as string) ?? ""} onChange={(e) => updateCondition(rule.id, i, { value: e.target.value })} placeholder="value" className="h-8 text-xs" />
                    </div>
                  );
                })}
                <Button size="sm" variant="ghost" onClick={() => addCondition(rule.id)}><Plus className="h-3 w-3" /> Add condition</Button>
              </div>

              <p className="stamp mb-1.5 mt-4 text-[10px] text-clinical-sage">Then apply action:</p>
              <div className="grid grid-cols-2 gap-4">
                <Select value={rule.action} onChange={(e) => updateRule(rule.id, { action: e.target.value as any })} className="h-8 text-xs">
                  {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </Select>
                
                {/* Enterprise Checklist for Target Fields (replaces bugged multi-select) */}
                <div className="h-32 overflow-y-auto rounded-xs border border-ink/15 p-2 thin-scroll dark:border-white/15">
                  <p className="mb-2 text-xs font-semibold text-ink-soft">Select Target Fields:</p>
                  {fields.map((f) => {
                    const isChecked = rule.targetFieldIds.includes(f.id);
                    return (
                      <label key={f.id} className="mb-1 flex cursor-pointer items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            const newTargets = e.target.checked 
                              ? [...rule.targetFieldIds, f.id] 
                              : rule.targetFieldIds.filter(id => id !== f.id);
                            updateRule(rule.id, { targetFieldIds: newTargets });
                          }}
                          className="accent-clinical-teal"
                        />
                        <span className="truncate">{f.label || f.internalName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRule}><Plus className="h-3.5 w-3.5" /> Add rule</Button>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-ink/10 pt-4 dark:border-white/10">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save rules</Button>
        </div>
      </Dialog>
    </>
  );
}
