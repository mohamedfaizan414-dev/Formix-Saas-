// app/dashboard/patients/patients-table-list.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Search, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";

interface PatientsTableListProps {
  initialPatients: any[];
  isSuperAdmin: boolean;
  hospitals: { id: string; name: string }[];
  organizationId: string | null | undefined;
}

export function PatientsTableList({ initialPatients, isSuperAdmin, hospitals, organizationId }: PatientsTableListProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  
  // 🌟 MODAL DIALOG STATE INITIALIZATION
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    hospitalId: organizationId ?? "",
  });

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const filteredPatients = initialPatients.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleRegisterPatient(e: React.FormEvent) {
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
      setIsModalOpen(false);
      setForm({ email: "", firstName: "", lastName: "", phone: "", hospitalId: organizationId ?? "" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePatient(id: string) {
    if (!confirm("Are you absolutely sure you want to completely delete this patient profile?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/patients?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to execute delete transaction.");
      toast.success("Patient profile removed successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not delete patient record.");
    } finally {
      setDeletingId(null);
    }
  }

  function setIsOpen(arg0: boolean): void {
    // Connect dialog onClose handler to local modal state
    setIsModalOpen(arg0);
  }

  return (
    <div className="space-y-4 w-full">
      {/* Search Input Bar Panel & Bound Activation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-paper-darkdim p-4 rounded-md border border-ink/10 dark:border-white/10">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
          <Input 
            placeholder="Search patient records..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9 h-9 text-sm focus-visible:ring-clinical-teal"
          />
        </div>
        
        {/* 🌟 CONNECTED: Button now opens the registration form dynamically */}
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-clinical-teal text-white hover:bg-clinical-tealdeep gap-1.5 text-xs h-9 font-medium shadow-xs"
        >
          <UserPlus className="h-4 w-4" /> Add Patient Record
        </Button>
      </div>

      {/* Desktop viewports persistent list grid table */}
      <div className="hidden sm:block overflow-hidden rounded-md border border-ink/10 dark:border-white/10 bg-white dark:bg-paper-darkdim">
        <table className="w-full text-sm">
          <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft dark:bg-white/5 dark:text-white/40">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email Address</th>
              <th className="px-4 py-3 font-medium">Date Registered</th>
              <th className="px-4 py-3 font-medium">Forms Tracked</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8 dark:divide-white/8 bg-white dark:bg-paper-darkdim">
            {filteredPatients.map((p) => (
              <tr key={p.id} className="hover:bg-ink/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-ink dark:text-white">
                  {p.firstName || p.lastName ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft font-mono text-xs">{p.email}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-clinical-teal/10 px-2.5 py-0.5 text-xs font-semibold text-clinical-teal">
                    {p.assignments?.length ?? 0} Forms
                  </span>
                </td>
                <td className="px-4 py-3 text-right flex items-center justify-end gap-1.5">
                  <Link href={`/dashboard/patients/${p.id}`}>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                      <Eye className="h-3.5 w-3.5" /> View Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={deletingId === p.id}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                    onClick={() => handleDeletePatient(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🌟 REDESIGNED FORM POPUP: Controlled cleanly by your real Dialog modal wrapper */}
      <Dialog open={isModalOpen} onClose={() => setIsOpen(false)} title="Register a new patient">
        <form onSubmit={handleRegisterPatient} className="space-y-4 text-left mt-2">
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
            <Input type="email" value={form.email} onChange={setField("email")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={setField("firstName")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={setField("lastName")} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number *</Label>
            <Input type="tel" value={form.phone} onChange={setField("phone")} required />
          </div>
          
          <div className="flex justify-end pt-4 border-t border-ink/5 mt-6">
            <Button type="submit" disabled={submitting} className="gap-2 bg-clinical-teal text-white hover:bg-clinical-tealdeep">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Registering…" : "Register patient"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}