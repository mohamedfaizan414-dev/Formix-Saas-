import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { SubmissionsTable } from "../components/dashboard/submissions-table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SubmissionsPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = React.useState(null);
  const [submissions, setSubmissions] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user && id) {
      setFetching(true);
      Promise.all([
        fetch(`/api/forms/${id}`).then((res) => {
          if (!res.ok) throw new Error("Failed to load form details");
          return res.json();
        }),
        fetch(`/api/submissions?formId=${id}`).then((res) => {
          if (!res.ok) throw new Error("Failed to load submissions");
          return res.json();
        }),
      ])
        .then(([formData, submissionsData]) => {
          setForm(formData.form);
          setSubmissions(submissionsData.submissions ?? []);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Form submissions details not found or unauthorized.");
          navigate("/forms");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [user, loading, id, navigate]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!form) return null;

  return (
    <AppShell active="forms">
      <div className="mx-auto max-w-5xl px-8 py-10 text-ink dark:text-white">
        <SubmissionsTable submissions={submissions} formId={id} formName={form.name} />
      </div>
    </AppShell>
  );
}
