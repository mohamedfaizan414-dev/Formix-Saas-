import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VersionsPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = React.useState(null);
  const [versions, setVersions] = React.useState([]);
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
        fetch(`/api/forms/${id}/versions`).then((res) => {
          if (!res.ok) throw new Error("Failed to load version history");
          return res.json();
        }),
      ])
        .then(([formData, versionsData]) => {
          setForm(formData.form);
          setVersions(versionsData.versions ?? []);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Form version details not found or unauthorized.");
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
    <main className="min-h-screen bg-paper px-6 py-10 dark:bg-paper-dark text-ink dark:text-white">
      <div className="mx-auto max-w-2xl">
        <Link to={`/forms/${id}/builder`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to builder
          </Button>
        </Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">{form.name} — Version history</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-white/50">Every save creates an immutable version. Old submissions stay linked to the version they were filled against.</p>

        <div className="mt-6 space-y-3">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border border-ink/10 p-4 dark:border-white/10 font-sans">
              <div>
                <p className="font-display text-sm font-semibold">Version {v.versionNumber}</p>
                <p className="mt-0.5 text-xs text-ink-soft/70">
                  {v.createdBy?.firstName ?? "System"} {v.createdBy?.lastName ?? ""} · {new Date(v.createdAt).toLocaleString()}
                </p>
                {v.changelog && <p className="mt-1 text-xs text-ink-soft/60">{v.changelog}</p>}
              </div>
              {v.isPublished && <Badge tone="sage">Published</Badge>}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
