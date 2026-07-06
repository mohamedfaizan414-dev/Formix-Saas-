// components/dashboard/new-form-dialog.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function NewFormDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  
  // States to handle hospital mapping explicitly for global Super Admins
  const [selectedHospitalId, setSelectedHospitalId] = React.useState("");
  const [hospitals, setHospitals] = React.useState<{ id: string; name: string }[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Fetch available hospital tenants explicitly upon dialog initialization
  React.useEffect(() => {
    if (!open) return;
    
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.role === "SUPER_ADMIN") {
          setIsSuperAdmin(true);
          
          // Fetch the available organizations directory list
          fetch("/api/hospitals")
            .then((res) => res.json())
            .then((hData) => {
              if (hData.hospitals && hData.hospitals.length > 0) {
                setHospitals(hData.hospitals);
                setSelectedHospitalId(hData.hospitals[0].id); // Baseline fallback selection
              }
            });
        }
      })
      .catch(() => console.error("Identity token validation error."));
  }, [open]);

  async function create() {
    if (!name.trim()) return toast.error("Give the form a name first.");
    if (isSuperAdmin && !selectedHospitalId) {
      return toast.error("Please select a target hospital to assign this form payload to.");
    }
    
    setLoading(true);
    try {
      // 🌟 FIXED: We pass 'hospitalId' which maps perfectly to the backend aliased destructuring key
      const payload = {
        name: name.trim(),
        description: description.trim(),
        ...(isSuperAdmin ? { hospitalId: selectedHospitalId } : {})
      };

      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Form generation request rejected.");
        return;
      }
      
      toast.success("Draft form initialized successfully.");
      setOpen(false);
      setName("");
      setDescription("");
      
      router.push(`/forms/${data.form.id}/builder`);
      router.refresh();
    } catch {
      toast.error("Network infrastructure interface timeout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm h-9">
        <Plus className="h-4 w-4 mr-1" /> New form
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)} title="Create a new form" className="w-full max-w-md p-4 sm:p-6">
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5 w-full">
            <Label>Form name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. OPD Assessment Form" className="text-xs sm:text-sm" />
          </div>
          
          {/* 🌟 CONDITIONAL MULTI-TENANT PICKER: Only shows up if logged in user is a system Super Admin */}
          {isSuperAdmin && hospitals.length > 0 && (
            <div className="space-y-1.5 w-full">
              <Label>Target Hospital Tenant</Label>
              <Select value={selectedHospitalId} onChange={(e) => setSelectedHospitalId(e.target.value)} className="text-xs sm:text-sm">
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
            </div>
          )}
          
          <div className="space-y-1.5 w-full">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter optional configuration summary details..." className="text-xs sm:text-sm" />
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2.5 w-full">
          <Button variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto order-2 sm:order-1 h-9 text-xs sm:text-sm">
            Cancel
          </Button>
          <Button onClick={create} disabled={loading} className="w-full sm:w-auto order-1 sm:order-2 h-9 text-xs sm:text-sm">
            {loading ? "Initializing..." : "Create & open builder"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}