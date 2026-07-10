"use client";

import * as React from "react";
import { Star, Upload as UploadIcon, PenLine, Eye, Download, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import type { FormComponentNode } from "@/lib/form-engine/types";

export interface FieldRendererProps {
  node: FormComponentNode;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  interactive?: boolean;
  readOnlyView?: boolean;
  error?: string;
}

export function alignmentClass(align?: string) {
  switch (align) {
    case "center":
      return "text-center flex flex-col items-center justify-center mx-auto";
    case "right":
      return "text-right flex flex-col items-end justify-end ml-auto";
    default:
      return "text-left flex flex-col items-start justify-start mr-auto";
  }
}

export function accentClass(accent?: string) {
  switch (accent) {
    case "teal": return "border-l-2 border-l-clinical-teal pl-2 sm:pl-3";
    case "sage": return "border-l-2 border-l-clinical-sage pl-2 sm:pl-3";
    case "brick": return "border-l-2 border-l-clinical-brick pl-2 sm:pl-3";
    case "amber": return "border-l-2 border-l-clinical-amber pl-2 sm:pl-3";
    default: return "";
  }
}

// 🧩 SHARED WIDTH-SLOT ENGINE — used by FieldShell, CanvasNode, ChildNode, and
// the live DynamicFormRenderer so every surface (builder canvas + published
// form) resolves "full/half/third/quarter" identically.
export function widthClass(width?: string) {
  switch (width) {
    case "half": 
      return "w-full md:w-[calc(50%-0.5rem)]";
    case "third": 
      return "w-full md:w-[calc(33.333%-0.667rem)]";
    case "quarter": 
      return "w-full md:w-[calc(25%-0.75rem)]";
    default: 
      return "w-full";
  }
}

// 👑 TYPOGRAPHY CUSTOMIZER ENGINE HOOK
function getTypographyClasses(node: FormComponentNode): string {
  const size = node.meta?.fontSize ?? "base";
  const weight = node.meta?.fontWeight ?? "normal";
  const color = node.meta?.textColor ?? "default";
  const family = node.meta?.fontFamily ?? "sans";

  const sizeMap: Record<string, string> = { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl" };
  const weightMap: Record<string, string> = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" };
  const colorMap: Record<string, string> = { default: "text-ink dark:text-white", teal: "text-clinical-teal", sage: "text-clinical-sage", brick: "text-clinical-brick", soft: "text-ink-soft" };
  const familyMap: Record<string, string> = { sans: "font-sans", serif: "font-serif", mono: "font-mono", display: "font-display" };

  return cn(sizeMap[size as string], weightMap[weight as string], colorMap[color as string], familyMap[family as string]);
}

export function FieldShell({ node, error, children }: { node: FormComponentNode; error?: string; children: React.ReactNode }) {
  const isPresentationElement = ["heading", "paragraph", "label", "divider", "htmlBlock", "imageDisplay", "spacer"].includes(node.type);

  if (isPresentationElement) {
    return (
      <div className={cn("px-1 py-1 w-full box-border", alignmentClass(node.display?.align), accentClass(node.display?.colorAccent))}>
        {children}
      </div>
    );
  }

  const isActionType = ["submit", "reset", "cancel", "previous", "next"].includes(node.type);

  return (
    /* 🌟 FIXED: Removed widthClass completely from here. 
       The parent CSS Grid handles widths via columns. This wrapper should simply occupy full space (w-full). */
    <div className={cn("space-y-1 w-full box-border flex-none", alignmentClass(node.display?.align), accentClass(node.display?.colorAccent))}>
      <div className="w-full flex flex-col">
        {node.label && !isActionType && (
          <label className={cn("mb-1 flex items-center gap-1 text-xs font-medium text-ink dark:text-white/85 whitespace-nowrap",
            node.display?.align === "center" ? "justify-center text-center" : node.display?.align === "right" ? "justify-end text-right" : "justify-start text-left"
          )}>
            {node.label}
            {node.validation?.required && <span className="text-clinical-brick">*</span>}
          </label>
        )}
        
        <div className={cn("w-full min-w-0 flex", 
          node.display?.align === "center" ? "justify-center" : node.display?.align === "right" ? "justify-end" : "justify-start"
        )}>
          {/* 🌟 FIXED: Changed conditional width maps to default cleanly to w-full so inputs occupy the entire column span */}
          <div className="min-w-0 w-full">
            {children}
          </div>
        </div>
      </div>
      {node.helpText && <p className={cn("text-[10px] text-ink-soft/70 dark:text-white/40 break-words mt-0.5",
        node.display?.align === "center" ? "text-center w-full" : node.display?.align === "right" ? "text-right w-full" : "text-left"
      )}>{node.helpText}</p>}
      {error && <p className="text-xs text-clinical-brick mt-0.5">{error}</p>}
    </div>
  );
}

function ReadOnlyComposite({ node, value }: { node: FormComponentNode; value: any }) {
  if (!value) return null;
  if (node.type === "vitals") {
    const v = value as Record<string, string>;
    const fields = [
      ["systolic", "Sys", "mmHg"], ["diastolic", "Dia", "mmHg"], ["heartRate", "HR", "bpm"],
      ["temperature", "Temp", "°F"], ["spo2", "SpO2", "%"], ["respRate", "RR", "/min"],
      ["weight", "Wt", "kg"], ["height", "Ht", "cm"]
    ];
    return (
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 gap-y-2 rounded-xs border border-ink/10 bg-ink/[0.02] p-2.5 sm:p-3 dark:border-white/10 dark:bg-white/[0.02]">
        {fields.map(([k, l, u]) => v[k] ? (
          <div key={k} className="flex items-baseline gap-1">
            <span className="text-xs text-ink-soft">{l}:</span>
            <span className="font-mono text-xs sm:text-sm font-semibold">{v[k]}<span className="text-[9px] text-ink-soft font-normal ml-0.5">{u}</span></span>
          </div>
        ) : null)}
      </div>
    );
  }

  if (["allergies", "medications", "prescription", "labOrders", "diagnosisIcd10", "patientInfo", "encounterDetails"].includes(node.type)) {
    const rows = Array.isArray(value) ? value : [];
    if (!rows.length) return <span className="text-xs italic text-ink-soft/50">None recorded</span>;
    const keys = Object.keys(rows[0] || {});
    if (!keys.length) return null;

    return (
      <div className="overflow-x-auto w-full rounded-xs border border-ink/10 dark:border-white/10 thin-scroll">
        <table className="w-full text-left text-xs min-w-[400px] sm:min-w-0">
          <thead className="bg-ink/[0.03] dark:bg-white/[0.03]">
            <tr>{keys.map((k) => <th key={k} className="p-2 font-medium capitalize text-ink-soft whitespace-nowrap">{k.replace(/([A-Z])/g, ' $1')}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-ink/10 dark:divide-white/10">
            {rows.map((r, i) => (
              <tr key={i} className="divide-x divide-ink/5 dark:divide-white/5">
                {keys.map((k) => <td key={k} className="p-2 truncate max-w-[150px]">{r[k] || "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <span className="font-mono text-xs break-all">{JSON.stringify(value)}</span>;
}

function ReadOnlyValue({ node, value }: { node: FormComponentNode; value: any }) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-xs italic text-ink-soft/40">Not provided</span>;
  }
  switch (node.type) {
    case "file": case "image": case "medicalImage":
      if (typeof value === "string" && (value.startsWith("http") || value.startsWith("data:image"))) {
        return (
          <div className="group relative mt-2 inline-block overflow-hidden rounded-md border border-ink/10 shadow-sm dark:border-white/10 max-w-full">
            <img src={value} alt="Attachment" className="max-h-48 sm:max-h-64 max-w-full object-contain bg-ink/[0.02] dark:bg-white/[0.02]" />
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-ink/60 opacity-0 backdrop-blur-[2px] transition-all duration-200 group-hover:opacity-100">
              <a href={value} target="_blank" rel="noreferrer" className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-transform hover:scale-110">
                <Eye className="h-4 w-4" />
              </a>
              <a href={value} download="attachment" className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-transform hover:scale-110">
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        );
      }
      if (typeof value === "string" && value.startsWith("data:")) {
        return (
          <a href={value} download="downloaded_file" className="mt-1 flex max-w-full sm:max-w-sm items-center justify-between rounded-md border border-ink/10 p-2.5 transition-colors hover:bg-ink/5 dark:border-white/10">
            <span className="flex items-center gap-2 text-xs sm:text-sm font-medium truncate"><File className="h-4 w-4 text-clinical-teal shrink-0" /> Attached document</span>
            <Download className="h-4 w-4 text-ink-soft shrink-0" />
          </a>
        );
      }
      return <span className="font-mono text-xs text-clinical-teal break-all">{value}</span>;

    case "signature": case "doctorSignature": case "patientSignature":
      if (typeof value === "string" && value.startsWith("data:image")) {
        return (
          <div className="mt-1 inline-block rounded-md border border-ink/10 bg-white p-2 max-w-full">
            <img src={value} alt="Signature" className="h-14 sm:h-20 max-w-full object-contain" />
          </div>
        );
      }
      return <span className="text-xs italic text-ink-soft/40">No signature</span>;

    case "checkbox": case "multiselect":
      return <span className="break-words">{Array.isArray(value) ? value.join(", ") : String(value)}</span>;
    case "textarea": case "nursingNotes":
      return <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">{String(value)}</p>;
    case "consent":
      return value ? <span className="font-medium text-clinical-sage text-xs sm:text-sm">✓ Consented and acknowledged</span> : <span className="font-medium text-clinical-brick text-xs sm:text-sm">✕ Not consented</span>;
    case "vitals": case "allergies": case "medications": case "prescription": case "labOrders": case "diagnosisIcd10": case "patientInfo": case "encounterDetails":
      return <ReadOnlyComposite node={node} value={value} />;
    default:
      return <span className="break-words text-xs sm:text-sm">{String(value)}</span>;
  }
}

function VitalsFields({ value, onChange, disabled }: { value: any; onChange: (v: any) => void; disabled?: boolean }) {
  const v = value || {};
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...v, [key]: e.target.value });
  const fields: [string, string, string][] = [
    ["systolic", "Systolic BP", "mmHg"], ["diastolic", "Diastolic BP", "mmHg"], ["heartRate", "Heart rate", "bpm"], ["temperature", "Temperature", "°F"],
    ["spo2", "SpO2", "%"], ["respRate", "Resp. rate", "/min"], ["weight", "Weight", "kg"], ["height", "Height", "cm"]
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 rounded-xs border border-clinical-sage/25 bg-clinical-sagelight/25 p-2.5 sm:p-3 md:grid-cols-4 w-full">
      {fields.map(([key, label, unit]) => (
        <div key={key} className="space-y-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wide text-clinical-tealdeep/70 truncate block">{label}</span>
          <div className="flex items-center gap-1">
            <Input disabled={disabled} value={v[key] ?? ""} onChange={set(key)} className="h-8 text-xs sm:text-sm min-w-0 flex-1" />
            <span className="text-[9px] sm:text-[10px] text-ink-soft/60 shrink-0">{unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RepeatingRows({ value, onChange, disabled, columns }: { value: any; onChange: (v: any) => void; disabled?: boolean; columns: { key: string; label: string }[] }) {
  const rows: Record<string, string>[] = Array.isArray(value) && value.length ? value : [{}];
  const update = (i: number, key: string, val: string) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  return (
    <div className="space-y-2 rounded-xs border border-ink/10 p-2.5 sm:p-3 dark:border-white/10 w-full overflow-hidden">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col sm:grid gap-2 w-full border-b border-ink/5 pb-2 sm:border-0 sm:pb-0" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
          {columns.map((c) => (
            <div key={c.key} className="w-full">
              <span className="text-[9px] uppercase text-ink-soft/60 sm:hidden block mb-0.5">{c.label}</span>
              <Input disabled={disabled} placeholder={c.label} value={row[c.key] ?? ""} onChange={(e) => update(i, c.key, e.target.value)} className="h-8 text-xs sm:text-sm w-full" />
            </div>
          ))}
        </div>
      ))}
      {!disabled && <button type="button" onClick={() => onChange([...rows, {}])} className="text-xs font-medium text-clinical-teal hover:underline pt-1">+ Add row</button>}
    </div>
  );
}

function SignaturePad({ disabled, value, onChange }: { disabled?: boolean; value: unknown; onChange: (v: unknown) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const drawing = React.useRef(false);

  React.useEffect(() => {
    if (value && typeof value === "string" && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new Image();
      img.onload = () => ctx?.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [value]);

  React.useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      const width = containerRef.current.getBoundingClientRect().width;
      canvasRef.current.width = width || 400;
      canvasRef.current.height = 120;
      if (value && typeof value === "string") {
        const ctx = canvasRef.current.getContext("2d");
        const img = new Image();
        img.onload = () => ctx?.drawImage(img, 0, 0, width, 120);
        img.src = value;
      }
    }
  }, []);

  const start = (e: React.PointerEvent) => { if (disabled) return; drawing.current = true; const ctx = canvasRef.current?.getContext("2d"); const rect = canvasRef.current!.getBoundingClientRect(); ctx?.beginPath(); ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top); };
  const move = (e: React.PointerEvent) => { if (!drawing.current || disabled) return; const ctx = canvasRef.current?.getContext("2d"); const rect = canvasRef.current!.getBoundingClientRect(); if (ctx) { ctx.strokeStyle = "#132A33"; ctx.lineWidth = 2; ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke(); } };
  const end = () => { if (!drawing.current) return; drawing.current = false; onChange(canvasRef.current?.toDataURL() ?? null); };

  return (
    <div ref={containerRef} className="space-y-2 w-full max-w-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full touch-none rounded-xs border border-dashed border-ink/25 bg-white dark:bg-paper-darkdim" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
      {!disabled && <button type="button" onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); onChange(null); }} className="flex items-center gap-1 text-xs text-ink-soft hover:text-clinical-brick"><PenLine className="h-3 w-3" /> Clear signature</button>}
    </div>
  );
}

export function FieldRenderer({ node, value, onChange, disabled, interactive = true, readOnlyView = false, error }: FieldRendererProps) {
  const [uploading, setUploading] = React.useState(false);
  const isDisabled = disabled || node.validation?.disabled || !interactive || uploading;
  const commonProps = { disabled: isDisabled, readOnly: node.validation?.readOnly, placeholder: node.placeholder };

  if (readOnlyView) {
    if (["heading", "paragraph", "label", "divider", "htmlBlock", "spacer"].includes(node.type)) {
      return (
        <FieldShell node={node} error={error}>
          {(() => {
            switch (node.type) {
              case "heading": return <h3 className={getTypographyClasses(node)}>{node.label}</h3>;
              case "paragraph": return <p className={getTypographyClasses(node)}>{node.label}</p>;
              case "label": return <span className={cn("uppercase tracking-wide", getTypographyClasses(node))}>{node.label}</span>;
              case "divider": return <hr className="border-ink/10 dark:border-white/10 my-1" />;
              case "htmlBlock": return <div className="prose prose-sm max-w-none break-words overflow-x-auto" dangerouslySetInnerHTML={{ __html: (node.meta?.html as string) ?? "" }} />;
              case "imageDisplay": return <div className="rounded-xs border border-dashed border-ink/20 p-4 text-center text-xs text-ink-soft">Image placeholder</div>;
              case "spacer": return <div style={{ height: Math.min((node.meta?.heightPx as number) ?? 24, 48) }} />;
            }
          })()}
        </FieldShell>
      );
    }

    if (["submit", "reset", "cancel", "previous", "next"].includes(node.type)) return null;

    return (
      <div className={cn("px-3 py-2.5 w-full", widthClass(node.display?.width), alignmentClass(node.display?.align), accentClass(node.display?.colorAccent))}>
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-soft/70 dark:text-white/40 break-words">
          {node.label || node.internalName}
        </span>
        <div className="text-xs sm:text-sm font-medium text-ink dark:text-white/90 min-w-0 w-full">
          <ReadOnlyValue node={node} value={value} />
        </div>
      </div>
    );
  }

  const body = (() => {
    switch (node.type) {
      case "text": case "email": case "password": case "phone": case "hidden":
        return <Input {...commonProps} type={node.type === "hidden" ? "text" : node.type} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={node.type === "hidden" ? "hidden" : "w-full text-xs sm:text-sm"} />;
      case "number": return <Input {...commonProps} type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full text-xs sm:text-sm" />;
      case "textarea": return <Textarea {...commonProps} rows={(node.meta?.rows as number) ?? 4} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full text-xs sm:text-sm" />;
      case "date": return <Input {...commonProps} type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full text-xs sm:text-sm min-h-[40px]" />;
      case "time": return <Input {...commonProps} type="time" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full text-xs sm:text-sm min-h-[40px]" />;
      case "datetime": return <Input {...commonProps} type="datetime-local" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full text-xs sm:text-sm min-h-[40px]" />;

      case "radio":
        return (
          <div className={cn("flex gap-2.5 sm:gap-4", node.orientation === "horizontal" ? "flex-row flex-wrap" : "flex-col")}>
            {(node.options ?? []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer py-0.5">
                <input type="radio" disabled={isDisabled} name={node.internalName} checked={value === opt.value} onChange={() => onChange(opt.value)} className="h-4 w-4 accent-clinical-teal shrink-0" />
                <span className="break-words min-w-0">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox": {
        const arr = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
            {(node.options ?? []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer py-0.5">
                <input type="checkbox" disabled={isDisabled} checked={arr.includes(opt.value)} onChange={(e) => onChange(e.target.checked ? [...arr, opt.value] : arr.filter((v) => v !== opt.value))} className="h-4 w-4 accent-clinical-teal shrink-0" />
                <span className="break-words min-w-0">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }
      case "dropdown":
        return (
          <Select disabled={isDisabled} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full text-xs sm:text-sm">
            <option value="">Select…</option>
            {(node.options ?? []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
        );
      case "multiselect": {
        const arr = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(node.options ?? []).map((opt) => {
              const active = arr.includes(opt.value);
              return (
                <button key={opt.value} type="button" disabled={isDisabled} onClick={() => onChange(active ? arr.filter((v) => v !== opt.value) : [...arr, opt.value])} className={cn("rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors break-words max-w-full", active ? "border-clinical-teal bg-clinical-teal text-paper" : "border-ink/15 text-ink-soft hover:bg-ink/5")}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      }
      case "toggle": return <Switch checked={!!value} onCheckedChange={onChange} disabled={isDisabled} />;
      case "yesno":
        return (
          <div className="flex gap-2 w-full sm:w-auto">
            {["Yes", "No"].map((opt) => (
              <button key={opt} type="button" disabled={isDisabled} onClick={() => onChange(opt)} className={cn("rounded-xs border px-4 py-2 text-xs sm:text-sm font-medium flex-1 sm:flex-none text-center transition-colors", value === opt ? "border-clinical-teal bg-clinical-teal text-paper" : "border-ink/15 text-ink-soft hover:bg-ink/5")}>{opt}</button>
            ))}
          </div>
        );
      case "rating": {
        const max = (node.meta?.max as number) ?? 5; const current = Number(value) || 0;
        return (
          <div className="flex gap-1.5 items-center min-h-[32px]">
            {Array.from({ length: max }).map((_, i) => <button key={i} type="button" disabled={isDisabled} className="p-0.5 transition-transform active:scale-95" onClick={() => onChange(i + 1)}><Star className={cn("h-5 w-5 sm:h-6 sm:w-6", i < current ? "fill-clinical-amber text-clinical-amber" : "text-ink/20")} /></button>)}
          </div>
        );
      }
      case "slider": {
        const min = (node.meta?.min as number) ?? 0; const max = (node.meta?.max as number) ?? 100;
        return (
          <div className="flex items-center gap-3 w-full">
            <input type="range" disabled={isDisabled} min={min} max={max} value={Number(value) || min} onChange={(e) => onChange(e.target.value)} className="w-full accent-clinical-teal min-h-[32px]" />
            <span className="w-8 text-right font-mono text-xs text-ink-soft shrink-0">{Number(value) || min}</span>
          </div>
        );
      }

      case "file": case "image": case "medicalImage": {
        const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return onChange(null);

          setUploading(true);
          const toastId = toast.loading("Uploading to Cloudinary...");

          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const dataUri = ev.target?.result as string;
              const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  dataUri,
                  originalName: file.name,
                  resourceType: node.type === "image" ? "image" : "auto"
                })
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Upload failed");

              onChange(data.asset.url);
              toast.success("File uploaded successfully", { id: toastId });
            } catch (err) {
              console.error(err);
              toast.error("Cloudinary upload failed.", { id: toastId });
              onChange(null);
            } finally {
              setUploading(false);
            }
          };
          reader.readAsDataURL(file);
        };

        return (
          <label className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-ink/25 py-5 sm:py-6 px-4 text-xs sm:text-sm text-ink-soft transition-colors hover:border-clinical-sage text-center w-full min-h-[64px]", isDisabled && "pointer-events-none opacity-50 bg-ink/5")}>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-clinical-teal" />
            ) : (
              <UploadIcon className="h-4 w-4 shrink-0 text-ink-soft/70" />
            )}
            {uploading ? "Uploading..." : (value ? "File attached (Tap to change)" : "Tap to upload asset")}
            <input type="file" className="hidden" accept={node.meta?.accept as string} disabled={isDisabled} onChange={handleFile} />
          </label>
        );
      }
      case "signature": case "doctorSignature": case "patientSignature": return <SignaturePad disabled={isDisabled} value={value} onChange={onChange} />;

      case "heading": return <h3 className={getTypographyClasses(node)}>{node.label}</h3>;
      case "paragraph": return <p className={getTypographyClasses(node)}>{node.label}</p>;
      case "label": return <span className={cn("uppercase tracking-wide w-full", getTypographyClasses(node))}>{node.label}</span>;
      case "divider": return <hr className="border-ink/10 dark:border-white/10 w-full my-0.5" />;
      case "htmlBlock": return <div className="prose prose-sm max-w-none break-words w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: (node.meta?.html as string) ?? "" }} />;
      case "imageDisplay": return <div className="rounded-xs border border-dashed border-ink/20 p-4 text-center text-xs text-ink-soft w-full">Static image placeholder</div>;
      case "spacer": return <div style={{ height: Math.min((node.meta?.heightPx as number) ?? 24, 48) }} className="w-full" />;

      case "submit": return <button type="submit" disabled={isDisabled} className="rounded-xs bg-clinical-teal px-5 py-2.5 text-xs sm:text-sm font-medium text-paper hover:bg-clinical-tealdeep w-full sm:w-auto text-center transition-colors shadow-sm">{node.label || "Submit"}</button>;
      case "reset": case "cancel": case "previous": case "next": return <button type="button" disabled={isDisabled} className="rounded-xs border border-ink/15 px-5 py-2.5 text-xs sm:text-sm font-medium text-ink-soft hover:bg-ink/5 w-full sm:w-auto text-center transition-colors">{node.label}</button>;

      case "vitals": return <VitalsFields value={value} onChange={onChange} disabled={isDisabled} />;
      case "allergies": return <RepeatingRows value={value} onChange={onChange} disabled={isDisabled} columns={[{ key: "allergen", label: "Allergen" }, { key: "reaction", label: "Reaction" }, { key: "severity", label: "Severity" }]} />;
      case "medications": return <RepeatingRows value={value} onChange={onChange} disabled={isDisabled} columns={[{ key: "drug", label: "Drug" }, { key: "dose", label: "Dose" }, { key: "frequency", label: "Frequency" }]} />;
      case "prescription": return <RepeatingRows value={value} onChange={onChange} disabled={isDisabled} columns={[{ key: "drug", label: "Drug" }, { key: "dose", label: "Dose" }, { key: "frequency", label: "Frequency" }, { key: "duration", label: "Duration" }]} />;
      case "labOrders": return <RepeatingRows value={value} onChange={onChange} disabled={isDisabled} columns={[{ key: "test", label: "Test" }, { key: "priority", label: "Priority" }, { key: "notes", label: "Notes" }]} />;
      case "diagnosisIcd10": return <RepeatingRows value={value} onChange={onChange} disabled={isDisabled} columns={[{ key: "code", label: "ICD-10 code" }, { key: "description", label: "Description" }]} />;
      case "nursingNotes": return <Textarea {...commonProps} rows={5} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Progress notes…" className="w-full text-xs sm:text-sm" />;
      case "consent":
        return (
          <label className="flex items-start gap-2.5 rounded-xs border border-ink/10 p-3 text-xs sm:text-sm dark:border-white/10 cursor-pointer w-full">
            <input type="checkbox" disabled={isDisabled} checked={!!value} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-clinical-teal shrink-0" />
            <span className="text-ink-soft break-words leading-tight">{node.description || "I acknowledge and consent to the above."}</span>
          </label>
        );
      case "patientInfo": return <RepeatingRows value={value} onChange={onChange} disabled={isDisabled} columns={[{ key: "name", label: "Full name" }, { key: "dob", label: "Date of birth" }, { key: "sex", label: "Sex" }, { key: "mrn", label: "MRN" }]} />;
      case "encounterDetails": return <RepeatingRows value={value} onChange={onChange} disabled={isDisabled} columns={[{ key: "visitType", label: "Visit type" }, { key: "department", label: "Department" }, { key: "attending", label: "Attending" }]} />;
      default: return <Input {...commonProps} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full text-xs sm:text-sm" />;
    }
  })();

  return <FieldShell node={node} error={error}>{body}</FieldShell>;
}