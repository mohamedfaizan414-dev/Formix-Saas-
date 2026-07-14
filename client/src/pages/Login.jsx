import * as React from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Logo } from "../components/ui/logo";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  }

  return (
    <main className="chart-paper flex min-h-screen items-center justify-center bg-paper px-6 dark:bg-paper-dark text-ink dark:text-white">
      <div className="w-full max-w-sm rounded-md border border-ink/10 bg-white p-8 shadow-panel dark:border-white/10 dark:bg-paper-darkdim">
        <div className="mb-8 flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-display text-lg font-semibold">Formix</span>
        </div>
        <h1 className="font-display text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-soft dark:text-white/50">Use your hospital-issued credentials.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required placeholder="name@hospital.org" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="mt-6 rounded-xs border border-clinical-sage/25 bg-clinical-sagelight/40 px-3 py-2.5 text-xs text-clinical-tealdeep">
          <span className="font-semibold">Demonstration Environment Notice:</span> Pre-configured sandbox credentials can be provisioned via the database initialization suite.
        </div>
      </div>
    </main>
  );
}
