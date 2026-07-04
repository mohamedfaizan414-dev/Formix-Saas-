import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const form = await prisma.form.findUnique({ where: { id } });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  if (session.role !== "SUPER_ADMIN" && form.hospitalId !== session.hospitalId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const versions = await prisma.formVersion.findMany({
    where: { formId: id },
    orderBy: { versionNumber: "desc" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json({ versions });
}
