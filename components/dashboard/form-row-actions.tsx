// components/dashboard/form-row-actions.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Share2, Edit3, Trash2, FileText, AlertTriangle, Check, Link2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Custom simple SVGs for brand networks to maintain zero-dependency reliability
const WhatsAppIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.296 1.503 5.355 1.504 5.583 0 10.126-4.544 10.13-10.115.002-2.699-1.045-5.236-2.952-7.143C17.228 1.493 14.7.445 12.013.445 6.43.445 1.89 4.986 1.887 10.557c-.001 1.93.501 3.81 1.456 5.474l-.979 3.575 3.693-.969z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface FormRowActionsProps {
  formId: string;
  status: string;
}

export function FormRowActions({ formId, status }: FormRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  
  // Share Sheet UI Control Modals
  const [shareOpen, setShareOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const secureShareUrl = typeof window !== "undefined" ? `${window.location.origin}/fill/${formId}` : "";

  // 📋 Copy Action Helper
  function copyToClipboard() {
    navigator.clipboard.writeText(secureShareUrl)
      .then(() => {
        setCopied(true);
        toast.success("Link copied directly to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to access system clipboard."));
  }

  // 🔄 Clone Existing Form Framework
  async function handleCloneForm() {
    setLoading(true);
    const toastId = toast.loading("Duplicating configuration models...");
    try {
      const res = await fetch(`/api/forms/${formId}/clone`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cloning failure");
      
      toast.success("Form cloned cleanly into a new draft template!", { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize copy routine.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  // 🗑️ Soft Deletion operational route triggers
  async function handleExecuteDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${formId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Deletion rejected");

      toast.success("Form structure unlinked successfully.");
      setDeleteOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove asset record.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1 w-full">
      {/* 1. View Responses / Submissions List */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/forms/${formId}/submissions`)}
        title="View Submissions"
        className="h-7 w-7 text-ink-soft hover:text-clinical-teal dark:text-white/40 dark:hover:text-white"
      >
        <FileText className="h-3.5 w-3.5" />
      </Button>

      {/* 2. Open Layout Builder Workspace */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/forms/${formId}/builder`)}
        title="Open Canvas Editor"
        className="h-7 w-7 text-ink-soft hover:text-ink dark:text-white/40 dark:hover:text-white"
      >
        <Edit3 className="h-3.5 w-3.5" />
      </Button>

      {/* 3. Clone Template */}
      <Button
        variant="ghost"
        size="icon"
        disabled={loading}
        onClick={handleCloneForm}
        title="Duplicate Structure"
        className="h-7 w-7 text-ink-soft hover:text-clinical-teal dark:text-white/40"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>

      {/* 4. Social & Clipboard Share Hub Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (status !== "PUBLISHED") {
            return toast.error("Only published forms can be shared publicly.");
          }
          setShareOpen(true);
        }}
        disabled={status !== "PUBLISHED"}
        title={status === "PUBLISHED" ? "Open Share Portal" : "Publish template framework to enable routing shortcuts"}
        className={`h-7 w-7 transition-colors ${
          status === "PUBLISHED" 
            ? "text-clinical-teal hover:bg-clinical-teal/10" 
            : "text-ink-soft/20 cursor-not-allowed dark:text-white/10"
        }`}
      >
        <Share2 className="h-3.5 w-3.5" />
      </Button>

      {/* 5. Safe Deletion Action Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteOpen(true)}
        title="Remove Form Schema"
        className="h-7 w-7 text-ink-soft hover:text-clinical-brick hover:bg-clinical-brick/5"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* 🌐 PREMIUM MULTI-PLATFORM SOCIAL SHARING HUB MODAL */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} title="Share Public Access Link" className="w-full max-w-sm p-4 sm:p-5">
        <div className="space-y-4 mt-3">
          <p className="text-xs text-ink-soft/80 leading-normal">
            Distribute this link to your patients or user base across digital workspaces to collect clinical assessments.
          </p>

          {/* Inline Copy Input Bar Wrapper */}
          <div className="flex items-center gap-1.5 rounded-md border border-ink/10 bg-paper-dim p-1 dark:border-white/10 dark:bg-white/5">
            <Input 
              readOnly 
              value={secureShareUrl} 
              className="h-7 border-0 bg-transparent text-xs text-ink-soft select-all shadow-none focus-visible:ring-0 min-w-0 flex-1 truncate" 
            />
            <Button 
              size="sm" 
              onClick={copyToClipboard}
              className="h-7 px-2.5 text-[11px] font-medium shrink-0"
              variant={copied ? "primary" : undefined}
            >
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Link2 className="h-3 w-3 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-ink/5 dark:border-white/5"></div>
            <span className="flex-shrink mx-3 text-[10px] text-ink-soft/40 uppercase tracking-widest font-mono">Social Networks</span>
            <div className="flex-grow border-t border-ink/5 dark:border-white/5"></div>
          </div>

          {/* Social Platform Touch Targets Stacking Row Matrices */}
          <div className="grid grid-cols-4 gap-2">
            {/* WhatsApp Deployment Link */}
            <a 
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Please fill out this medical assessment form: ${secureShareUrl}`)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-ink/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-ink-soft hover:text-emerald-500 dark:border-white/5 transition-all group"
            >
              <WhatsAppIcon />
              <span className="text-[10px] font-medium">WhatsApp</span>
            </a>

            {/* LinkedIn Placement Target */}
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(secureShareUrl)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-ink/5 hover:border-blue-600/30 hover:bg-blue-600/5 text-ink-soft hover:text-blue-600 dark:border-white/5 transition-all group"
            >
              <LinkedInIcon />
              <span className="text-[10px] font-medium">LinkedIn</span>
            </a>

            {/* Twitter/X Deployment Routing */}
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Clinical data entry layout portal available here:`)}&url=${encodeURIComponent(secureShareUrl)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-ink/5 hover:border-black/30 hover:bg-black/5 text-ink-soft hover:text-black dark:hover:text-white dark:hover:bg-white/5 dark:border-white/5 transition-all group"
            >
              <TwitterIcon />
              <span className="text-[10px] font-medium">Twitter (X)</span>
            </a>

            {/* Native Email Composition Link */}
            <a 
              href={`mailto:?subject=${encodeURIComponent("Clinical Assessment Link Required")}&body=${encodeURIComponent(`Please find your public clinical questionnaire link below:\n\n${secureShareUrl}`)}`}
              className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-ink/5 hover:border-clinical-teal/30 hover:bg-clinical-teal/5 text-ink-soft hover:text-clinical-teal dark:border-white/5 transition-all group"
            >
              <Mail className="h-4 w-4" />
              <span className="text-[10px] font-medium">Email</span>
            </a>
          </div>
        </div>
      </Dialog>

      {/* 🚨 TOUCH FRIENDLY DELETION MODAL INTERFACE SHEET */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Confirm Administrative Purge" className="w-full max-w-sm p-4 sm:p-5">
        <div className="space-y-3 mt-2">
          <div className="flex items-center gap-2 rounded-xs bg-clinical-brick/10 p-2.5 text-clinical-brick text-xs font-mono font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" /> WARNING: DESTRUCTIVE ACTION
          </div>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
            Are you certain you wish to safely unlink this operational form metadata template container? Saved patient database schema submission logs won't be modified.
          </p>
        </div>
        <div className="mt-5 flex flex-col sm:flex-row justify-end gap-2 w-full">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={loading} className="w-full sm:w-auto order-2 sm:order-1 h-8 text-xs">
            Cancel
          </Button>
          <Button variant="brick" onClick={handleExecuteDelete} disabled={loading} className="w-full sm:w-auto order-1 sm:order-2 h-8 text-xs">
            {loading ? "Archiving…" : "Confirm Deletion"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}