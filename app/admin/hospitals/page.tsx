// app/admin/hospitals/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/dashboard/app-shell";
import { Badge } from "@/components/ui/badge";
import { HospitalToggle } from "@/components/dashboard/hospital-toggle";
import { NewHospitalDialog } from "@/components/dashboard/new-hospital-dialog";

export default async function HospitalsPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") redirect("/dashboard");

  const hospitals = await prisma.hospital.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { forms: true, users: true } } },
  });

  return (
    <AppShell active="hospitals">
      {/* 🌟 UPDATED: Responsive horizontal spacing (px-4 on mobile devices, px-8 on desktop monitors) */}
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10">
        
        {/* 🌟 UPDATED: Main page header flex layout collapses logically into a stack on smaller viewports */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Multi-tenant management</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Hospitals</h1>
          </div>
          <div className="w-full sm:w-auto shrink-0 flex">
            <NewHospitalDialog />
          </div>
        </div>

        {/* Dynamic responsive grid columns */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {hospitals.map((h) => (
            <div key={h.id} className="rounded-md border border-ink/10 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-paper-darkdim flex flex-col justify-between shadow-panel gap-3">
              <div className="min-w-0">
                
                {/* 🌟 UPDATED: Card title and status indicator wrap neatly to prevent clipping */}
                <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <p className="font-display text-sm font-semibold text-ink dark:text-white truncate max-w-[180px] sm:max-w-none">
                    {h.name}
                  </p>
                  <Badge tone={h.isActive ? "sage" : "brick"} className="shrink-0 text-[10px]">
                    {h.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[11px] text-ink-soft/60 truncate">{h.slug}</p>
              </div>

              {/* 🌟 UPDATED: Bottom actions bar optimized with full-height tap areas for the active switch control */}
              <div className="mt-1 flex items-center justify-between text-xs text-ink-soft border-t border-ink/5 pt-3 w-full min-h-[36px]">
                <span className="font-medium">{h._count.forms} forms · {h._count.users} users</span>
                <div className="scale-95 origin-right flex items-center justify-center min-w-[44px] min-h-[24px]">
                  <HospitalToggle hospitalId={h.id} isActive={h.isActive} />
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}