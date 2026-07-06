// app/api/hospitals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  
  // Strict Security Enforcement Guardrail
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only a Super Admin can permanently remove organizations." }, { status: 403 });
  }

  try {
    const hospital = await prisma.hospital.findUnique({ where: { id } });
    if (!hospital) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    // Cascade delete operation handled inside a transactional unit
    await prisma.hospital.delete({
      where: { id }
    });

    // Write attributable audit log entry for regulatory compliance history tracking
    await writeAuditLog({
      action: "form.deleted", // Re-using form.deleted or extending custom AuditAction type matches app structure
      entityType: "hospital",
      entityId: id,
      userId: session.sub,
      metadata: { name: hospital.name, slug: hospital.slug }
    });

    return NextResponse.json({ ok: true, message: "Organization and all related clinical datasets successfully purged." });
  } catch (error) {
    console.error("Critical error during hospital cascading delete:", error);
    return NextResponse.json({ error: "Internal server error processing cascading data deletion." }, { status: 500 });
  }
}