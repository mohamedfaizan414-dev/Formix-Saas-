import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function NewHospitalDialog({ onSuccess }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", address: "", phone: "" });

  async function create() {
    if (!form.name.trim()) return toast.error("Give the organization a name first.");
    setLoading(true);
    try {
      const res = await fetch("/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error ?? "Couldn't create organization");
      toast.success(`${data.hospital.name} onboarded.`);
      setForm({ name: "", address: "", phone: "" });
      setOpen(false);
      if (onSuccess) onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New organization</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Onboard a new hospital">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Organization / hospital name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Northgate Medical Center" />
          </div>
          <div className="space-y-1.5">
            <Label>Address (optional)</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone (optional)</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={loading}>{loading ? "Creating…" : "Create organization"}</Button>
        </div>
      </Dialog>
    </>
  );
}
