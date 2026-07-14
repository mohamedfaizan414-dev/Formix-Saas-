import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DynamicFormRenderer } from "../components/renderer/dynamic-form-renderer";
import { toast } from "sonner";

export default function SubmissionViewPage() {
  const { id, subId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = React.useState(null);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user && subId) {
      setFetching(true);
      fetch(`/api/submissions/${subId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load submission details");
          return res.json();
        })
        .then((data) => {
          if (data.submission.formId !== id) {
            toast.error("Submission doesn't match the current form context.");
            navigate(`/forms/${id}/submissions`);
            return;
          }
          setSubmission(data.submission);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Submission record not found or unauthorized.");
          navigate(`/forms/${id}/submissions`);
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [user, loading, id, subId, navigate]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!submission) return null;

  const schema = submission.formVersion.schema;
  const data = submission.data;

  return (
    <AppShell active="forms">
      <div className="mx-auto max-w-4xl px-8 py-10 text-ink dark:text-white">
        <Link to={`/forms/${id}/submissions`}>
          <Button variant="ghost" size="sm" className="-ml-3 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to submissions
          </Button>
        </Link>

        <div className="mb-8 flex items-center justify-between border-b border-ink/10 pb-6 dark:border-white/10">
          <div>
            <p className="stamp text-xs text-clinical-sage">{submission.form.name}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">
              Submission from {submission.submittedBy?.firstName ?? "Public"} {submission.submittedBy?.lastName ?? ""}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Submitted on {new Date(submission.createdAt).toLocaleString()} · Against schema v{submission.formVersion.versionNumber}
            </p>
          </div>
          <Badge tone={submission.status === "SUBMITTED" ? "sage" : "amber"}>{submission.status}</Badge>
        </div>

        <div className="rounded-md border border-ink/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-paper-darkdim">
          <DynamicFormRenderer schema={schema} initialValues={data} mode="preview" />
        </div>
      </div>
    </AppShell>
  );
}
