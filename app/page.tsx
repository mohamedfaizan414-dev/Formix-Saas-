// app/page.tsx
import Link from "next/link";
import { ArrowRight, LayoutGrid, GitBranch, ShieldCheck, Workflow, Globe, Terminal, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveChartMock } from "@/components/marketing/live-chart-mock";
import { Logo } from "@/components/ui/logo";

const capabilities = [
  {
    icon: LayoutGrid,
    title: "Drag, drop, chart it",
    body: "40 field types across basic, selection, upload, layout, action, and clinical categories. Nest sections, cards, tabs, and accordions without limit.",
  },
  {
    icon: Workflow,
    title: "Rules that read like orders",
    body: "IF Gender = Female, SHOW Pregnancy Section. Nested AND/OR groups evaluate live as a form is filled, no redeploy required.",
  },
  {
    icon: GitBranch,
    title: "Every edit, a new chart",
    body: "Publishing a form never overwrites history. Admission Form v1, v2, v3 — old submissions stay pinned to the version they were filled against.",
  },
  {
    icon: ShieldCheck,
    title: "One hospital, one record",
    body: "Strict tenant isolation on every query. Role-based access for Super Admin, Hospital Admin, Doctor, Nurse, and Receptionist.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-display text-lg font-semibold tracking-tight">Formix</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="#capabilities" className="hover:text-ink">Capabilities</a>
          <a href="#fields" className="hover:text-ink">Field library</a>
          <a href="#roles" className="hover:text-ink">Roles</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/login"><Button size="sm">Open builder</Button></Link>
        </div>
      </header>

      {/* HERO */}
      <section className="chart-paper relative mx-auto max-w-6xl overflow-hidden rounded-lg border border-ink/10 px-8 py-16 md:px-14 md:py-24 dark:border-white/10">
        <div className="absolute right-8 top-8 hidden rotate-[-8deg] animate-stampIn items-center gap-2 rounded-xs border-2 border-clinical-brick/60 px-3 py-1.5 md:flex">
          <span className="stamp text-xs font-semibold text-clinical-brick">Form v3 · Published</span>
        </div>
        <Badge tone="sage" className="mb-6">No HTML is ever stored. Only structured JSON.</Badge>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
          Chart the form once.
          <br />
          Render it everywhere a hospital works.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-soft dark:text-white/60">
          Formix is the drafting table for admission forms, nursing assessments,
          consent, and discharge paperwork — built by hospital admins, filled by clinicians,
          versioned like a chart.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/login"><Button size="lg">Start building<ArrowRight className="h-4 w-4" /></Button></Link>
          <Link href="/login"><Button size="lg" variant="outline">View a live form</Button></Link>
        </div>

        <div className="mt-16">
          <LiveChartMock />
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-24 md:px-0">
        <p className="stamp text-xs text-clinical-sage">The engine underneath</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Four systems, one JSON schema
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10 dark:border-white/10 dark:bg-white/10 md:grid-cols-2">
          {capabilities.map((c) => (
            <div key={c.title} className="bg-paper p-8 dark:bg-paper-dark">
              <c.icon className="h-5 w-5 text-clinical-brick" strokeWidth={1.75} />
              <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-white/55">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="mx-auto max-w-6xl px-6 pb-24 md:px-0">
        <p className="stamp text-xs text-clinical-sage">Who touches the chart</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Five roles, one hospital record
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {[
            ["Super Admin", "Manages every hospital, publishes global templates."],
            ["Hospital Admin", "Builds hospital forms, publishes to departments."],
            ["Doctor", "Fills encounters, reviews history, signs off."],
            ["Nurse", "Vitals, observations, progress notes."],
            ["Receptionist", "Registration, demographics, documents."],
          ].map(([role, desc]) => (
            <div key={role} className="rounded-md border border-ink/10 p-5 dark:border-white/10">
              <p className="font-display text-sm font-semibold">{role}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft dark:text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 🌟 UPGRADED: ENTERPRISE MULTI-COLUMN RESPONSIVE FOOTER */}
      <footer className="border-t border-ink/10 bg-white dark:bg-paper-darkdim dark:border-white/10 transition-colors">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            
            {/* Column 1: Brand Identifier Stack (Spans 2 columns on small screens) */}
            <div className="col-span-2 space-y-4 pr-0 md:pr-8">
              <div className="flex items-center gap-2.5">
                <Logo size="sm" />
                <span className="font-display text-base font-bold tracking-tight text-ink dark:text-white">
                  Formix Clinical
                </span>
              </div>
              <p className="text-xs leading-relaxed text-ink-soft dark:text-white/50 max-w-sm">
                The unified clinical schema infrastructure and engine for mission-critical electronic health records, dynamic medical workflows, and structural field rendering parameters.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-ink/5 dark:bg-white/5 text-ink-soft dark:text-white/45">
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-ink/5 dark:bg-white/5 text-ink-soft dark:text-white/45">
                  <Terminal className="h-3.5 w-3.5" />
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-ink/5 dark:bg-white/5 text-ink-soft dark:text-white/45">
                  <Shield className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Column 2: Platform System Anchors */}
            <div className="space-y-3">
              <p className="stamp text-[10px] font-bold text-clinical-sage tracking-wider">
                Architecture
              </p>
              <ul className="space-y-2 text-xs text-ink-soft dark:text-white/60">
                <li><a href="#capabilities" className="hover:text-clinical-teal transition-colors">Dynamic Engine</a></li>
                <li><a href="#fields" className="hover:text-clinical-teal transition-colors">Field Registry</a></li>
                <li><a href="#roles" className="hover:text-clinical-teal transition-colors">RBAC Matrix</a></li>
                <li><a href="/login" className="hover:text-clinical-teal transition-colors">JSON Form Schema</a></li>
              </ul>
            </div>

            {/* Column 3: Governance Compliance */}
            <div className="space-y-3">
              <p className="stamp text-[10px] font-bold text-clinical-sage tracking-wider">
                Compliance
              </p>
              <ul className="space-y-2 text-xs text-ink-soft dark:text-white/60">
                <li><span className="opacity-95">Multi-Tenancy</span></li>
                <li><span className="opacity-95">Immutable Auditing</span></li>
                <li><span className="opacity-95">Data Isolation</span></li>
                <li><span className="opacity-95">Sandbox Environs</span></li>
              </ul>
            </div>

            {/* Column 4: Quick Authentication Portals */}
            <div className="space-y-3">
              <p className="stamp text-[10px] font-bold text-clinical-sage tracking-wider">
                Systems Access
              </p>
              <ul className="space-y-2 text-xs text-ink-soft dark:text-white/60">
                <li><Link href="/login" className="hover:text-clinical-teal transition-colors">Sign In Portal</Link></li>
                <li><Link href="/login" className="hover:text-clinical-teal transition-colors">Initialize Schema</Link></li>
                <li><Link href="/login" className="hover:text-clinical-teal transition-colors">EHR Form Builder</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright & Verification Ribbon */}
          <div className="mt-12 border-t border-ink/10 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-ink-soft/70 dark:text-white/40 font-mono">
            <div>
              &copy; {new Date().getFullYear()} Formix Systems Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-clinical-tealdeep dark:text-clinical-sagelight">
                <span className="h-1.5 w-1.5 rounded-full bg-clinical-sage animate-ping" />
                HL7 Data Compatible
              </span>
            </div>
          </div>

        </div>
      </footer>
    </main>
  );
}