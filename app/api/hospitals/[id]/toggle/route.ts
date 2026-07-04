import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const hospital = await prisma.hospital.findUnique({ where: { id } });
  if (!hospital) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.hospital.update({ where: { id }, data: { isActive: !hospital.isActive } });
  await writeAuditLog({ action: "hospital.toggled", entityType: "hospital", entityId: id, userId: session.sub, metadata: { isActive: updated.isActive } });

  return NextResponse.json({ hospital: updated });
}
