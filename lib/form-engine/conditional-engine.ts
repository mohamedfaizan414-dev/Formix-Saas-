import type {
  ConditionalRule,
  ConditionGroup,
  ConditionRule,
  FormComponentNode,
  FormSchema,
} from "./types";

type FormValues = Record<string, unknown>;

function isGroup(x: ConditionRule | ConditionGroup): x is ConditionGroup {
  return (x as ConditionGroup).combinator !== undefined;
}

function coerceCompare(a: unknown, b: unknown): [number, number] | null {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return null;
  return [na, nb];
}

export function evaluateRule(rule: ConditionRule, values: FormValues): boolean {
  const fieldValue = values[rule.field];
  switch (rule.operator) {
    case "equals":
      return String(fieldValue ?? "") === String(rule.value ?? "");
    case "notEquals":
      return String(fieldValue ?? "") !== String(rule.value ?? "");
    case "contains":
      if (Array.isArray(fieldValue)) return fieldValue.includes(rule.value);
      return String(fieldValue ?? "").includes(String(rule.value ?? ""));
    case "greaterThan": {
      const pair = coerceCompare(fieldValue, rule.value);
      return pair ? pair[0] > pair[1] : false;
    }
    case "lessThan": {
      const pair = coerceCompare(fieldValue, rule.value);
      return pair ? pair[0] < pair[1] : false;
    }
    case "greaterOrEqual": {
      const pair = coerceCompare(fieldValue, rule.value);
      return pair ? pair[0] >= pair[1] : false;
    }
    case "lessOrEqual": {
      const pair = coerceCompare(fieldValue, rule.value);
      return pair ? pair[0] <= pair[1] : false;
    }
    case "isEmpty":
      return fieldValue === undefined || fieldValue === null || fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0);
    case "isNotEmpty":
      return !(fieldValue === undefined || fieldValue === null || fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0));
    default:
      return false;
  }
}

export function evaluateGroup(group: ConditionGroup, values: FormValues): boolean {
  const results = group.rules.map((r) =>
    isGroup(r) ? evaluateGroup(r, values) : evaluateRule(r, values)
  );
  if (group.combinator === "AND") return results.every(Boolean);
  return results.some(Boolean);
}

export interface FieldRuntimeState {
  visible: boolean;
  disabled: boolean;
  required: boolean;
  forcedValue?: unknown;
}

export interface JumpDirective {
  toSectionId: string;
}

// Computes the resulting runtime state for every field in the schema given
// the current form values, by applying all conditional rules in order.
export function computeRuntimeState(
  schema: FormSchema,
  values: FormValues
): { fields: Record<string, FieldRuntimeState>; jump?: JumpDirective } {
  const fields: Record<string, FieldRuntimeState> = {};

  const visit = (node: FormComponentNode) => {
    fields[node.id] = {
      visible: !node.validation.hidden,
      disabled: !!node.validation.disabled,
      required: !!node.validation.required,
    };
    node.children?.forEach(visit);
  };
  schema.sections.forEach((s) => s.components.forEach(visit));

  let jump: JumpDirective | undefined;

  for (const rule of schema.conditionalRules) {
    const matched = evaluateGroup(rule.when, values);
    if (!matched) continue;

    for (const targetId of rule.targetFieldIds) {
      const state = fields[targetId];
      if (!state) continue;
      switch (rule.action) {
        case "show":
          state.visible = true;
          break;
        case "hide":
          state.visible = false;
          break;
        case "enable":
          state.disabled = false;
          break;
        case "disable":
          state.disabled = true;
          break;
        case "require":
          state.required = true;
          break;
        case "unrequire":
          state.required = false;
          break;
        case "setValue":
          state.forcedValue = rule.setValueTo;
          break;
        case "jumpToSection":
          if (rule.jumpTargetSectionId) jump = { toSectionId: rule.jumpTargetSectionId };
          break;
      }
    }
  }

  return { fields, jump };
}
