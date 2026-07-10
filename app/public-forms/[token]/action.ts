"use server";

import { PatientService } from "@/lib/services/patient-service";

export async function submitPublicForm(
  token: string,
  values: Record<string, unknown>,
  isDraft: boolean
) {
  await PatientService.recordSubmission(token, values, isDraft);
  return { success: true };
}