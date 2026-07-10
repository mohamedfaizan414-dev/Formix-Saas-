// app/api/patients/assignments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access call." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json({ error: "Missing required assignment ID parameter." }, { status: 400 });
    }

    // Execute absolute purge sequence from ledger
    await prisma.formAssignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database assignment deletion transaction failure:", error);
    return NextResponse.json({ error: "Internal execution breakdown." }, { status: 500 });
  }
}