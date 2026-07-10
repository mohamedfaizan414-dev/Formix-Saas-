// lib/form-engine/build-zod-schema.ts
import { z } from "zod";

export function buildZodSchemaForNodes(fields: any[]) {
  const shape: Record<string, any> = {};

  fields.forEach((field) => {
    let validator: any = z.any();
    const fieldType = (field.type || "").toLowerCase();

    switch (fieldType) {
      case "vitals":
      case "grid":
      case "object":
        validator = z.object({}).passthrough();
        break;
      case "allergies":
      case "repeater":
      case "array":
        validator = z.array(z.any());
        break;
      case "checkbox":
      case "consent":
      case "boolean":
        validator = z.boolean();
        break;
      case "text":
      case "textarea":
      case "signature":
      case "id":
      case "patientsignature":
      case "doctorsignature":
      case "select":
      default:
        validator = z.string();
        break;
    }

    if (!field.required && !field.validation?.required) {
      validator = validator.optional().nullable();
    } else {
      if (fieldType === "text" || fieldType === "signature" || fieldType === "patientsignature" || fieldType === "doctorsignature") {
        validator = validator.min(1, { message: `${field.label || 'Field'} is required.` });
      } else if (fieldType === "consent") {
        validator = z.literal(true, {
          errorMap: () => ({ message: `You must consent to proceed.` }),
        });
      }
    }

    // 🌟 FIXED: Prioritize internalName to match the DynamicFormRenderer state keys perfectly
    const fieldKey = field.internalName || field.name || field.id;
    if (fieldKey) {
      shape[fieldKey] = validator;
    }
  });

  return z.object(shape);
}