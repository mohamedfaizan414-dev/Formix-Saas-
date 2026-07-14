import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DynamicFormRenderer } from "../components/renderer/dynamic-form-renderer";
import { Badge } from "../components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PreviewPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = React.useState(null);
  const [schema, setSchema] = React.useState(null);
  const [latestVersion, setLatestVersion] = React.useState(null);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user && id) {
      setFetching(true);
      fetch(`/api/forms/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load form details");
          return res.json();
        })
        .then((data) => {
          setForm(data.form);
          setSchema(data.latestSchema);
          setLatestVersion(data.versions?.[0] ?? null);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Form template not found or unauthorized.");
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
    <main className="chart-paper min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark text-ink dark:text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3 font-sans">
          <h1 className="font-display text-2xl font-semibold">{schema?.title ?? form.name}</h1>
          <Badge tone="amber">Preview · v{latestVersion?.versionNumber ?? 1}</Badge>
        </div>
        {schema ? <DynamicFormRenderer schema={schema} mode="preview" /> : <p className="font-sans text-sm text-ink-soft">No version to preview yet.</p>}
      </div>
    </main>
  );
}
