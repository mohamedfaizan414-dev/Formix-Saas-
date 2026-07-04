import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { hashPassword } from "@/lib/auth/jwt";
import { writeAuditLog } from "@/lib/audit/log";
import type { RoleName } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const where: Record<string, unknown> = { deletedAt: null };
  if (session.role !== "SUPER_ADMIN") where.hospitalId = session.hospitalId;

  const users = await prisma.user.findMany({
    where,
    include: { role: true, hospital: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "user.manage")) {
    return NextResponse.json({ error: "You don't have permission to manage users." }, { status: 403 });
  }

  const body = await req.json();
  const { email, firstName, lastName, roleName, hospitalId: hospitalIdInput, password } = body as {
    email: string; firstName: string; lastName: string; roleName: RoleName; hospitalId?: string; password?: string;
  };

  if (session.role === "HOSPITAL_ADMIN" && roleName === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Hospital Admins cannot create Super Admins." }, { status: 403 });
  }

  const hospitalId = session.role === "SUPER_ADMIN" ? hospitalIdInput : session.hospitalId!;
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const passwordHash = await hashPassword(password || "Passw0rd!");

  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), firstName, lastName, passwordHash, roleId: role.id, hospitalId },
  });

  await writeAuditLog({ action: "user.created", entityType: "user", entityId: user.id, userId: session.sub, hospitalId });

  return NextResponse.json({ user });
}
