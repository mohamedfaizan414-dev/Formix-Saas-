import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Button } from "../ui/button";

export function NewPatientDialog({ isSuperAdmin, hospitals, organizationId, onSuccess }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    hospitalId: organizationId ?? "",
  });

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSuperAdmin && !form.hospitalId) {
      toast.error("Please select a hospital for this patient.");
      return;
    }
    if (!form.email || !form.firstName || !form.lastName || !form.phone) {
      toast.error("All clinical fields are absolutely compulsory.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          organizationId: isSuperAdmin ? form.hospitalId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create patient.");

      toast.success("Patient registered successfully.");
      setOpen(false);
      setForm({ email: "", firstName: "", lastName: "", phone: "", hospitalId: organizationId ?? "" });
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New Patient
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Register a new patient">
        <form onSubmit={handleSubmit} className="space-y-4 text-left mt-2">
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label>Hospital *</Label>
              <Select
                value={form.hospitalId}
                onChange={(e) => setForm((prev) => ({ ...prev, hospitalId: e.target.value }))}
                required
              >
                <option value="">Select a hospital…</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Email Address *</Label>
            <Input type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={set("firstName")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={set("lastName")} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number *</Label>
            <Input type="tel" value={form.phone} onChange={set("phone")} required />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-ink/5 mt-6">
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Registering…" : "Register patient"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
