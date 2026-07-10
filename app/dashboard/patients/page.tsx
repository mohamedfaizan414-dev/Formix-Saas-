// app/dashboard/patients/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { PatientService } from "@/lib/services/patient-service";
import { AppShell } from "@/components/dashboard/app-shell";
import { PatientsTableList } from "@/components/dashboard/patients-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPatientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // 🌟 FIXED: Translate the JWT session token payload parameters into the shape PatientService expects
  const userContext = {
    id: session.sub, // Maps standard sub key directly
    role: session.role,
    organizationId: session.hospitalId ?? null, // Bridges hospitalId down to organizationId cleanly
  };

  // Fetch only the patients registered under this specific nurse's hospital tenant group
  const patientsRecords = await PatientService.getPatients(userContext);

  const hospitals = session.role === "SUPER_ADMIN" 
    ? await prisma.hospital.findMany({ select: { id: true, name: true } }) 
    : [];

  return (
    <AppShell active="patients">
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4 w-full">
          <div>
            <p className="stamp text-[10px] sm:text-xs text-clinical-sage">Identity & Access</p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-semibold">Patients</h1>
          </div>
        </div>

        <PatientsTableList 
          initialPatients={patientsRecords} 
          isSuperAdmin={session.role === "SUPER_ADMIN"}
          hospitals={hospitals}
          organizationId={session.hospitalId}
        />
      </div>
    </AppShell>
  );
}