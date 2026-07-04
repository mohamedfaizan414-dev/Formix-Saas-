import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const hospitals = await prisma.hospital.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { forms: true, users: true } } },
  });
  return NextResponse.json({ hospitals });
}

// POST /api/hospitals — onboard a new tenant hospital
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only Super Admin can add organizations." }, { status: 403 });
  }

  const { name, address, phone } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  }

  const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.hospital.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const hospital = await prisma.hospital.create({
    data: { name: name.trim(), slug, address, phone, isActive: true },
  });

  await writeAuditLog({
    action: "hospital.created",
    entityType: "hospital",
    entityId: hospital.id,
    userId: session.sub,
    hospitalId: hospital.id,
  });

  return NextResponse.json({ hospital });
}