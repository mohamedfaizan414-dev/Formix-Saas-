import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BuilderShell } from "../components/builder/builder-shell";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FormBuilderPage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = React.useState(null);
  const [schema, setSchema] = React.useState(null);
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
          if (!res.ok) throw new Error("Failed to load form template");
          return res.json();
        })
        .then((data) => {
          setForm(data.form);
          const initialSchema = data.latestSchema ?? {
            title: data.form.name,
            layout: "single",
            sections: [{ id: "s1", title: "Section 1", components: [] }],
            conditionalRules: [],
          };
          setSchema(initialSchema);
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

  if (!form || !schema) return null;

  return <BuilderShell formId={form.id} status={form.status} initialSchema={schema} />;
}
