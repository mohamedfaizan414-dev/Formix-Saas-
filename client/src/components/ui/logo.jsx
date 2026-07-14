import * as React from "react";

export function Logo({ size = "md" }) {
  const dimensions = {
    sm: { box: "h-7 w-7", inner: "h-3.5 w-3.5", gap: "gap-[1px]", radius: "rounded-xs" },
    md: { box: "h-8 w-8", inner: "h-4 w-4", gap: "gap-[1.5px]", radius: "rounded-sm" },
    lg: { box: "h-10 w-10", inner: "h-5 w-5", gap: "gap-[2px]", radius: "rounded-md" },
  }[size];

  return (
    <div className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br from-[#132A33] to-[#0F222B] rounded-lg shadow-sm ${dimensions.box} ${dimensions.radius}`}>
      <div className={`grid grid-cols-2 ${dimensions.gap} ${dimensions.inner}`}>
        <div className="rounded-[1px] bg-clinical-sage opacity-90" />
        <div className="rounded-[1px] bg-clinical-brick" />
        <div className="rounded-[1px] bg-white/20" />
        <div className="rounded-[1px] bg-white" />
      </div>
      <div className={`absolute inset-0 border border-white/5 ${dimensions.radius}`} />
    </div>
  );
}
