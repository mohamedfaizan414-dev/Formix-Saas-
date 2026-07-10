import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { PatientService } from "@/lib/services/patient-service";
import { prisma } from "@/lib/prisma";

const createPatientSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  organizationId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action"); // 🌟 Read the query parameter action label

    const body = await req.json().catch(() => null);

    // 🌟 ROUTINE 1: HANDLE FORM ASSIGNMENT DISPATCH
    if (action === "assign") {
      if (!body?.patientId || !body?.formId) {
        return NextResponse.json({ error: "Missing patientId or formId attributes." }, { status: 400 });
      }

      const assignment = await PatientService.assignForm(body.patientId, body.formId, {
        id: session.sub ?? (session as any).id,
        role: session.role,
        organizationId: session.hospitalId ?? null,
      });

      return NextResponse.json({ assignment }, { status: 201 });
    }

    // 🌟 ROUTINE 2: HANDLE NEW PATIENT CREATION (Your existing code)
    const parsed = createPatientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const patient = await PatientService.createPatient(parsed.data, {
      id: session.sub ?? (session as any).id,
      role: session.role,
      organizationId: session.hospitalId ?? null,
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (err: any) {
    console.error("POST operational path breakdown:", err);
    return NextResponse.json({ error: err.message ?? "Failed to complete transaction processing." }, { status: 400 });
  }
}



// Keep your existing POST method completely intact here...

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access call." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json({ error: "Missing required ID parameter." }, { status: 400 });
    }

    // 🌟 ACTION 1: Delete a single form assignment from the ledger
    if (type === "assignment") {
      await prisma.formAssignment.delete({
        where: { id }
      });
      // 🌟 FIXED: Explicitly return the response so the code stops executing here!
      return NextResponse.json({ success: true });
    }

    // 🌟 ACTION 2: Delete the whole patient profile
    if (session.role !== "SUPER_ADMIN") {
      const targetedRecord = await prisma.patient.findUnique({ where: { id } });
      if (!targetedRecord || targetedRecord.organizationId !== session.hospitalId) {
        return NextResponse.json({ error: "Cross-tenant data mutation access denied." }, { status: 403 });
      }
    }

    await prisma.patient.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database deletion transaction failure:", error);
    return NextResponse.json({ error: "Internal operational execution database breakdown." }, { status: 500 });
  }
}