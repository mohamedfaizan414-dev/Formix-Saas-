import * as React from "react";
import { Plus, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function InlineTemplatePanel({ node, onUpdate }) {
  const tokens = node.config?.tokens || [];

  function pushConfigUpdate(newTokens) {
    onUpdate({ ...node.config, tokens: newTokens });
  }

  function updateToken(index, fields) {
    const updated = [...tokens];
    updated[index] = { ...updated[index], ...fields };
    pushConfigUpdate(updated);
  }

  function addToken(type) {
    const timestamp = Date.now();
    let fresh;

    if (type === "text") {
      fresh = { type, value: "" };
    } else if (type === "dropdown") {
      fresh = { type, key: `dropdown_${timestamp}`, options: ["Option 1", "Option 2"] };
    } else {
      fresh = { type, key: `blank_${timestamp}`, placeholder: "Fill text..." };
    }

    pushConfigUpdate([...tokens, fresh]);
  }

  function deleteToken(index) {
    pushConfigUpdate(tokens.filter((_, i) => i !== index));
  }

  function moveToken(index, direction) {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tokens.length) return;
    
    const nextTokens = [...tokens];
    const temporary = nextTokens[index];
    nextTokens[index] = nextTokens[targetIdx];
    nextTokens[targetIdx] = temporary;
    pushConfigUpdate(nextTokens);
  }

  return (
    <div className="space-y-4 border-t border-ink/10 pt-4 dark:border-white/10">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase tracking-wider text-clinical-sage">Template Segments</Label>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 thin-scroll">
        {tokens.map((token, idx) => (
          <div key={idx} className="flex flex-col gap-2 border border-ink/10 p-2.5 rounded bg-paper-dim dark:bg-paper-dark dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-clinical-sagelight text-clinical-tealdeep dark:bg-white/10 dark:text-white">
                {token.type}
              </span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => moveToken(idx, "up")}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === tokens.length - 1} onClick={() => moveToken(idx, "down")}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => deleteToken(idx)}><Trash className="h-3 w-3" /></Button>
              </div>
            </div>

            {token.type === "text" && (
              <Input
                value={token.value ?? ""}
                onChange={(e) => updateToken(idx, { value: e.target.value })}
                placeholder="Type static segment..."
                className="h-8 text-xs bg-white dark:bg-paper-darkdim"
              />
            )}

            {token.type === "input" && (
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  value={token.key ?? ""}
                  onChange={(e) => updateToken(idx, { key: e.target.value.replace(/\s+/g, "_") })}
                  placeholder="variable_key"
                  className="h-8 text-xs font-mono bg-white dark:bg-paper-darkdim"
                />
                <Input
                  value={token.placeholder ?? ""}
                  onChange={(e) => updateToken(idx, { placeholder: e.target.value })}
                  placeholder="Placeholder text"
                  className="h-8 text-xs bg-white dark:bg-paper-darkdim"
                />
              </div>
            )}

            {token.type === "dropdown" && (
              <div className="space-y-1.5">
                <Input
                  value={token.key ?? ""}
                  onChange={(e) => updateToken(idx, { key: e.target.value.replace(/\s+/g, "_") })}
                  placeholder="variable_key"
                  className="h-8 text-xs font-mono bg-white dark:bg-paper-darkdim"
                />
                <Input
                  value={token.options?.join(", ") ?? ""}
                  onChange={(e) => updateToken(idx, { options: e.target.value.split(",").map(s => s.trim()) })}
                  placeholder="Option A, Option B, Option C"
                  className="h-8 text-xs bg-white dark:bg-paper-darkdim"
                />
              </div>
            )}
          </div>
        ))}

        {tokens.length === 0 && (
          <p className="text-center text-xs py-4 text-ink-soft/40 italic">No template nodes configured.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 pt-1">
        <Button type="button" size="sm" variant="outline" className="text-[11px] h-8" onClick={() => addToken("text")}>+ Text</Button>
        <Button type="button" size="sm" variant="outline" className="text-[11px] h-8" onClick={() => addToken("input")}>+ Blank</Button>
        <Button type="button" size="sm" variant="outline" className="text-[11px] h-8" onClick={() => addToken("dropdown")}>+ List</Button>
      </div>
    </div>
  );
}
