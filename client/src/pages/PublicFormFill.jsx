import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Home } from "lucide-react"; 
import { DynamicFormRenderer } from "../components/renderer/dynamic-form-renderer";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export default function PublicFormFillPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [assignment, setAssignment] = React.useState(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/public-forms/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load form assignment");
        return res.json();
      })
      .then((data) => {
        setAssignment(data.assignment);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Form link is invalid or has expired.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(values, isDraft) {
    try {
      const res = await fetch(`/api/public-forms/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, isDraft }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to submit form.");
      }

      toast.success(isDraft ? "Draft progress saved!" : "Form submitted successfully!");
      if (!isDraft) {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message ?? "Could not save submission.");
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-soft bg-paper dark:bg-paper-dark">Loading clinical form…</main>;
  if (!assignment) return <main className="flex min-h-screen items-center justify-center text-sm text-ink-soft bg-paper dark:bg-paper-dark">This assignment link is invalid or expired.</main>;

  const schema = assignment.formVersion.schema;

  return (
    <main className="chart-paper min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark text-ink dark:text-white">
      <div className="mx-auto max-w-3xl">
        
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-md border border-ink/10 bg-white dark:bg-paper-darkdim dark:border-white/10 shadow-panel mt-10 animate-stampIn font-sans">
            <CheckCircle2 className="h-12 w-12 text-clinical-sage mb-4" strokeWidth={1.5} />
            <h2 className="font-display text-xl font-semibold text-ink dark:text-white">Response Submitted</h2>
            <p className="mt-2 text-sm text-ink-soft max-w-sm leading-relaxed">
              Hi <span className="font-medium text-ink dark:text-white">{assignment.patient.firstName}</span>, your response for <span className="font-medium text-ink dark:text-white">"{assignment.formTitle}"</span> has been securely recorded in the clinical registry.
            </p>
            <div className="mt-8">
              <Button size="sm" onClick={() => navigate("/")} className="flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" /> Return home
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between font-sans border-b border-ink/5 pb-4">
              <div>
                <p className="stamp text-[10px] text-clinical-sage uppercase">Clinical Document Intake</p>
                <h1 className="font-display text-2xl font-semibold mt-1">{assignment.formTitle}</h1>
                <p className="text-xs text-ink-soft mt-1">Patient: {assignment.patient.firstName} {assignment.patient.lastName}</p>
              </div>
              <Badge tone="sage">{assignment.status}</Badge>
            </div>

            <DynamicFormRenderer
              schema={schema}
              mode="fill"
              initialValues={assignment.payload || undefined}
              onSubmit={handleSubmit}
              assignmentToken={token}
            />
          </>
        )}

      </div>
    </main>
  );
}
