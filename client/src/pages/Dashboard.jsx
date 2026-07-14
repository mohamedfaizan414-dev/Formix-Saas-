import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ROLE_LABELS } from "../lib/rbac/permissions";
import { FileStack, ClipboardList, Building2, Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      setFetching(true);
      fetch("/api/dashboard")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load dashboard data");
          return res.json();
        })
        .then((resData) => {
          setData(resData);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error loading dashboard data.");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [user, loading, navigate]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-paper dark:bg-paper-dark">
        <Loader2 className="h-8 w-8 animate-spin text-clinical-teal" />
      </div>
    );
  }

  if (!user) return null;

  const isBuilderRole = user.role === "SUPER_ADMIN" || user.role === "HOSPITAL_ADMIN";

  if (isBuilderRole) {
    const stats = data?.stats || { formCount: 0, publishedCount: 0, submissionCount: 0, hospitalCount: 1 };
    const recentForms = data?.recentForms || [];

    return (
      <AppShell active="dashboard">
        <div className="mx-auto max-w-5xl px-8 py-10 text-ink dark:text-white">
          <p className="stamp text-xs text-clinical-sage">{ROLE_LABELS[user.role]} dashboard</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Overview</h1>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Total forms", value: stats.formCount, icon: FileStack },
              { label: "Published", value: stats.publishedCount, icon: Activity },
              { label: "Submissions", value: stats.submissionCount, icon: ClipboardList },
              ...(user.role === "SUPER_ADMIN" ? [{ label: "Hospitals", value: stats.hospitalCount, icon: Building2 }] : []),
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold font-display">{stat.value}</p>
                    <p className="text-xs text-ink-soft">{stat.label}</p>
                  </div>
                  <stat.icon className="h-5 w-5 text-clinical-sage" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8">
            <CardHeader><CardTitle>Recently updated forms</CardTitle></CardHeader>
            <CardContent className="divide-y divide-ink/8 p-0 dark:divide-white/8">
              {recentForms.map((f) => (
                <Link key={f.id} to={`/forms/${f.id}/builder`} className="flex items-center justify-between px-5 py-3 hover:bg-ink/[0.02] dark:hover:bg-white/[0.02]">
                  <span className="text-sm font-medium">{f.name}</span>
                  <Badge tone={f.status === "PUBLISHED" ? "sage" : "amber"}>{f.status}</Badge>
                </Link>
              ))}
              {recentForms.length === 0 && <p className="px-5 py-6 text-sm text-ink-soft/60">No forms yet.</p>}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Clinical roles: Doctor / Nurse / Receptionist
  const publishedForms = data?.publishedForms || [];
  const myDrafts = data?.myDrafts || [];

  return (
    <AppShell active="dashboard">
      <div className="mx-auto max-w-4xl px-8 py-10 text-ink dark:text-white">
        <p className="stamp text-xs text-clinical-sage">{ROLE_LABELS[user.role]} dashboard</p>
        <h1 className="mt-1 font-display text-2xl font-semibold">Available forms</h1>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {publishedForms.map((f) => (
            <Link key={f.id} to={`/fill/${f.id}`} className="rounded-md border border-ink/10 bg-white p-5 shadow-panel transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-paper-darkdim">
              <p className="font-display text-sm font-semibold">{f.name}</p>
              <p className="mt-1 text-xs text-ink-soft/70">{f.description}</p>
            </Link>
          ))}
          {publishedForms.length === 0 && <p className="text-sm text-ink-soft/60">No published forms available yet.</p>}
        </div>

        {myDrafts.length > 0 && (
          <Card className="mt-8">
            <CardHeader><CardTitle>Your drafts</CardTitle></CardHeader>
            <CardContent className="divide-y divide-ink/8 p-0 dark:divide-white/8">
              {myDrafts.map((d) => (
                <Link key={d.id} to={`/fill/${d.formId}`} className="flex items-center justify-between px-5 py-3 hover:bg-ink/[0.02]">
                  <span className="text-sm">{d.form.name}</span>
                  <Badge tone="amber">Draft</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
