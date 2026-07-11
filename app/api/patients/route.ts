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

const assignFormSchema = z.object({
  patientId: z.string().min(1),
  formId: z.string().optional(),
  formIds: z.array(z.string().min(1)).optional(),
}).refine((data) => !!data.formId || (data.formIds && data.formIds.length > 0), {
  message: "Either formId or formIds must be provided.",
  path: ["formId", "formIds"],
});

export async function POST(req: Request) {
  try {
    // 1. Authentication Layer Guardrail
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthenticated dynamic action call." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const body = await req.json().catch(() => null);

    // Context hydration payload mapping
    const userCtx = {
      id: session.sub ?? (session as any).id,
      role: session.role,
      organizationId: session.hospitalId ?? null,
    };
// 🌟 ROUTINE 1: HANDLE FORM ASSIGNMENT DISPATCH
    if (action === "assign") {
      const parsedAssign = assignFormSchema.safeParse(body);
      if (!parsedAssign.success) {
        return NextResponse.json({ 
          error: parsedAssign.error.issues[0]?.message ?? "Invalid validation criteria payload." 
        }, { status: 400 });
      }

      const { patientId, formId, formIds } = parsedAssign.data;
      
      // Normalize single value inputs or arrays into a clean stream array layout
      const targetedFormIds = formIds && formIds.length > 0 ? formIds : [formId!];

      // 🌟 FIXED: Execute operations concurrently using Promise.all WITHOUT a transaction block.
      // This frees the database instantly and handles email dispatches safely in the background.
      const assignmentBatchResult = await Promise.all(
        targetedFormIds.map((targetFormId) => 
          PatientService.assignForm(patientId, targetFormId, userCtx)
        )
      );

      return NextResponse.json({ 
        success: true, 
        count: assignmentBatchResult.length 
      }, { status: 201 });
    }

  } catch (err: any) {
    // 3. Centralized Runtime Exception Logging
    console.error("Critical transaction breakdown at POST operational route:", err);
    return NextResponse.json({ 
      error: err.message ?? "Internal database mutation transaction error." 
    }, { status: 500 });
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