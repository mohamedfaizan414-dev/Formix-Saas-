"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function HospitalToggle({ hospitalId, isActive }: { hospitalId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals/${hospitalId}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  function cn(arg0: string, arg1: string): string | undefined {
    const classes = [arg0, arg1].filter(Boolean);
    return classes.length > 0 ? classes.join(" ") : undefined;
  }

  return (
    <div className={cn("transition-opacity", loading ? "opacity-50 pointer-events-none" : "opacity-100")}>
      <Switch checked={isActive} onCheckedChange={toggle} />
    </div>
  );
}