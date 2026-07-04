import { z, ZodTypeAny } from "zod";
import type { FormComponentNode, FormSchema } from "./types";
import { isLayoutType } from "./field-registry";

function fieldToZod(node: FormComponentNode): ZodTypeAny | null {
  if (isLayoutType(node.type) || node.type === "action" || ["heading", "paragraph", "label", "divider", "htmlBlock", "imageDisplay", "spacer", "submit", "reset", "cancel", "previous", "next"].includes(node.type)) {
    return null; // non-data-bearing nodes
  }

  let schema: ZodTypeAny;

  switch (node.type) {
    case "number":
    case "rating":
    case "slider": {
      let s = z.coerce.number();
      if (node.validation.min !== undefined) s = s.min(node.validation.min, node.validation.customMessage);
      if (node.validation.max !== undefined) s = s.max(node.validation.max, node.validation.customMessage);
      schema = s;
      break;
    }
    case "checkbox":
    case "multiselect":
      schema = z.array(z.string());
      break;
    case "toggle":
    case "yesno":
      schema = z.union([z.boolean(), z.string()]);
      break;
    case "email": {
      let s = z.string().email(node.validation.customMessage ?? "Enter a valid email address");
      schema = s;
      break;
    }
    default: {
      let s: any = z.string();
      if (node.validation.minLength !== undefined) s = s.min(node.validation.minLength, node.validation.customMessage);
      if (node.validation.maxLength !== undefined) s = s.max(node.validation.maxLength, node.validation.customMessage);
      if (node.validation.pattern) {
        try {
          const re = new RegExp(node.validation.pattern);
          s = s.regex(re, node.validation.customMessage ?? "Value does not match the required format");
        } catch {
          // ignore invalid regex authored in the builder
        }
      }
      schema = s;
    }
  }

  if (!node.validation.required) {
    schema = schema.optional().nullable();
  }

  return schema;
}

// Builds a Zod object schema from the *currently visible* fields only —
// caller should pass the runtime-visible node list so hidden/disabled
// conditional fields don't block submission.
export function buildZodSchemaForNodes(nodes: FormComponentNode[]) {
  const shape: Record<string, ZodTypeAny> = {};
  const walk = (list: FormComponentNode[]) => {
    for (const node of list) {
      const zField = fieldToZod(node);
      if (zField) shape[node.internalName] = zField;
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return z.object(shape);
}

export function buildZodSchemaForForm(schema: FormSchema) {
  const allNodes = schema.sections.flatMap((s) => s.components);
  return buildZodSchemaForNodes(allNodes);
}
