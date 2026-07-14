import * as React from "react";
import { Switch } from "../ui/switch";
import { toast } from "sonner";

export function HospitalToggle({ hospitalId, isActive, onSuccess }) {
  const [loading, setLoading] = React.useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/hospitals/${hospitalId}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`transition-opacity ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      <Switch checked={isActive} onCheckedChange={toggle} />
    </div>
  );
}
