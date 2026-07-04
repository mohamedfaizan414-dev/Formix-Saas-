"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/rbac/permissions";

export function NewUserDialog({ isSuperAdmin, hospitals }: { isSuperAdmin: boolean; hospitals: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", firstName: "", lastName: "", roleName: "RECEPTIONIST", hospitalId: hospitals[0]?.id ?? "" });

  async function create() {
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error);
      toast.success(`User created. Default password: Passw0rd!`);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add user</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add a user">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>First name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Last name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })}>
              {Object.entries(ROLE_LABELS).filter(([k]) => isSuperAdmin || k !== "SUPER_ADMIN").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label>Hospital</Label>
              <Select value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}>
                {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </Select>
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={loading}>{loading ? "Creating…" : "Create user"}</Button>
        </div>
      </Dialog>
    </>
  );
}
