import { z } from "zod";

export function buildZodSchemaForNodes(fields) {
  const shape = {};

  fields.forEach((field) => {
    let validator = z.any();
    const fieldType = (field.type || "").toLowerCase();

    switch (fieldType) {
      case "inlinetemplate":
        validator = z.object({}).passthrough();
        break;

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
      if (fieldType === "text" || fieldType === "signature" || fieldType === "patientsignature") {
        validator = validator.min(1, { message: `${field.label || "Field"} cannot be submitted blank.` });
      } else if (fieldType === "consent") {
        validator = z.literal(true, {
          errorMap: () => ({ message: "Consent checkbox authorization mandatory." }),
        });
      }
    }

    const fieldKey = field.internalName || field.name || field.id;
    if (fieldKey) {
      shape[fieldKey] = validator;
    }
  });

  return z.object(shape);
}
