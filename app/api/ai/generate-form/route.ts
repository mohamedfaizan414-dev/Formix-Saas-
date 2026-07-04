import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/rbac/permissions";
import { generateFormSchemaFromPrompt } from "@/lib/ai/generate-form";

// The one real LLM-powered feature: describe a form in plain English, get a
// JSON schema back that drops straight into the builder canvas.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!roleHasPermission(session.role, "form.create")) {
    return NextResponse.json({ error: "You don't have permission to create forms." }, { status: 403 });
  }

  const { prompt } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "Describe the form you want first." }, { status: 400 });

  try {
    const schema = await generateFormSchemaFromPrompt(prompt);
    return NextResponse.json({ schema });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "AI generation failed. Check GROQ_API_KEY." },
      { status: 502 }
    );
  }
}
