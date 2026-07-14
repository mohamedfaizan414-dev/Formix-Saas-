import * as React from "react";
import { toast } from "sonner";
import { Send, Loader2, Search, Check, ChevronDown, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils/cn";

export function IssueFormSection({ patientId, availableForms, onSuccess }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFormIds, setSelectedFormIds] = React.useState([]);
  const [sending, setSending] = React.useState(false);

  const containerRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredForms = availableForms.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function toggleForm(id) {
    setSelectedFormIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function removeForm(id, e) {
    e.stopPropagation();
    setSelectedFormIds((prev) => prev.filter((item) => item !== id));
  }

  async function handleSend() {
    if (selectedFormIds.length === 0) {
      toast.error("Please select at least one form.");
      return;
    }
    
    setSending(true);
    try {
      const res = await fetch("/api/patients?action=assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          patientId, 
          formIds: selectedFormIds 
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Server rejected parameters." }));
        throw new Error(errData.error || "Failed to process assignments.");
      }

      toast.success(`${selectedFormIds.length} form(s) sent successfully to patient email.`);
      setSelectedFormIds([]);
      setSearchQuery("");
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setSending(false);
    }
  }

  if (availableForms.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 p-4 text-xs text-ink-soft/60">
        No published forms available yet under this hospital.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-ink/10 bg-white p-4 dark:border-white/10 dark:bg-paper-darkdim shadow-panel">
      <div className="relative w-full" ref={containerRef}>
        <div
          onClick={() => !sending && setIsOpen(!isOpen)}
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center justify-between gap-1.5 rounded-xs border border-ink/15 bg-white p-2 text-sm text-ink cursor-pointer outline-none transition-colors",
            isOpen && "border-clinical-teal",
            sending && "opacity-50 pointer-events-none",
            "dark:bg-paper-darkdim dark:border-white/15 dark:text-[#DCE7E4]"
          )}
        >
          {selectedFormIds.length === 0 ? (
            <span className="text-ink/35 dark:text-white/30 pl-1">Select forms...</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedFormIds.map((id) => {
                const item = availableForms.find((f) => f.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded bg-clinical-sagelight px-2 py-0.5 text-xs font-medium text-clinical-tealdeep dark:bg-white/10 dark:text-white"
                  >
                    {item?.title}
                    <X
                      className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                      onClick={(e) => removeForm(id, e)}
                    />
                  </span>
                );
              })}
            </div>
          )}
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-auto" />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-ink/10 bg-white p-1.5 shadow-panel thin-scroll dark:border-white/10 dark:bg-paper-darkdim">
            <div className="relative mb-1 flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 opacity-40" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs focus-visible:ring-clinical-teal bg-paper-dim dark:bg-paper-dark"
                autoFocus
              />
            </div>

            <div className="space-y-0.5 pt-1">
              {filteredForms.map((form) => {
                const isSelected = selectedFormIds.includes(form.id);
                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => toggleForm(form.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xs px-2.5 py-1.5 text-left text-xs text-ink-soft hover:bg-ink/5 dark:text-white/70 dark:hover:bg-white/5 transition-colors",
                      isSelected && "bg-clinical-teal/5 text-clinical-tealdeep font-medium dark:bg-white/10 dark:text-white"
                    )}
                  >
                    <span className="truncate">{form.title}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-clinical-teal" />}
                  </button>
                );
              })}

              {filteredForms.length === 0 && (
                <p className="p-3 text-center text-xs italic text-ink-soft/40">No matching templates</p>
              )}
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSend} disabled={sending || selectedFormIds.length === 0} className="w-full gap-2">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending cluster..." : `Send ${selectedFormIds.length > 0 ? `(${selectedFormIds.length}) ` : ""}to patient`}
      </Button>
    </div>
  );
}
