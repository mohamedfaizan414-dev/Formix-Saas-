import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="chart-paper flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-6 text-center dark:bg-paper-dark">
      <p className="stamp text-xs text-clinical-brick">404 · Not charted</p>
      <h1 className="font-display text-2xl font-semibold">This page doesn't exist</h1>
      <Link href="/dashboard"><Button variant="outline" className="mt-2">Back to dashboard</Button></Link>
    </main>
  );
}
