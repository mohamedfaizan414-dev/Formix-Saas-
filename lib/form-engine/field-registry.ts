import { nanoid } from "nanoid";
import type { FieldCategory, FieldType, FormComponentNode } from "./types";

export interface PropertySupport {
  options?: boolean; // radio/dropdown/etc option list editor
  minMax?: boolean;
  minMaxLength?: boolean;
  pattern?: boolean;
  defaultValue?: boolean;
  fileConfig?: boolean;
  rows?: boolean; // textarea
  orientation?: boolean;
  isLayout?: boolean;
}

export interface FieldDefinition {
  type: FieldType;
  category: FieldCategory;
  label: string;
  icon: string; // lucide-react icon name
  description: string;
  supports: PropertySupport;
  createNode: () => FormComponentNode;
}

function base(
  type: FieldType,
  label: string,
  overrides: Partial<FormComponentNode> = {}
): FormComponentNode {
  return {
    id: nanoid(10),
    type,
    label,
    internalName: `${type}_${nanoid(4)}`,
    validation: { required: false },
    display: { width: "full" },
    ...overrides,
  };
}

const registryList: FieldDefinition[] = [
  // ---------------- BASIC ----------------
  { type: "text", category: "basic", label: "Text Field", icon: "TextCursorInput", description: "Single-line text input", supports: { minMaxLength: true, pattern: true, defaultValue: true }, createNode: () => base("text", "Text Field", { placeholder: "Enter text" }) },
  { type: "textarea", category: "basic", label: "Text Area", icon: "AlignLeft", description: "Multi-line text input", supports: { minMaxLength: true, defaultValue: true, rows: true }, createNode: () => base("textarea", "Text Area", { placeholder: "Enter details", meta: { rows: 4 } }) },
  { type: "number", category: "basic", label: "Number", icon: "Hash", description: "Numeric input", supports: { minMax: true, defaultValue: true }, createNode: () => base("number", "Number") },
  { type: "email", category: "basic", label: "Email", icon: "AtSign", description: "Email address input", supports: { defaultValue: true }, createNode: () => base("email", "Email", { placeholder: "name@hospital.org" }) },
  { type: "password", category: "basic", label: "Password", icon: "KeyRound", description: "Masked password input", supports: { minMaxLength: true }, createNode: () => base("password", "Password") },
  { type: "phone", category: "basic", label: "Phone Number", icon: "Phone", description: "Phone number input", supports: { pattern: true, defaultValue: true }, createNode: () => base("phone", "Phone Number", { placeholder: "+1 (___) ___-____" }) },
  { type: "date", category: "basic", label: "Date Picker", icon: "Calendar", description: "Date selection", supports: { defaultValue: true, minMax: true }, createNode: () => base("date", "Date") },
  { type: "time", category: "basic", label: "Time Picker", icon: "Clock", description: "Time selection", supports: { defaultValue: true }, createNode: () => base("time", "Time") },
  { type: "datetime", category: "basic", label: "Date & Time", icon: "CalendarClock", description: "Date and time selection", supports: { defaultValue: true }, createNode: () => base("datetime", "Date & Time") },
  { type: "hidden", category: "basic", label: "Hidden Field", icon: "EyeOff", description: "Hidden value carried in submission", supports: { defaultValue: true }, createNode: () => base("hidden", "Hidden Field", { validation: { required: false, hidden: true } }) },

  // ---------------- SELECTION ----------------
  { type: "radio", category: "selection", label: "Radio Button", icon: "CircleDot", description: "Single choice from a list", supports: { options: true, orientation: true, defaultValue: true }, createNode: () => base("radio", "Radio Button", { options: [{ label: "Option 1", value: "option_1" }, { label: "Option 2", value: "option_2" }], orientation: "vertical" }) },
  { type: "checkbox", category: "selection", label: "Checkbox", icon: "SquareCheck", description: "Multiple choice checkboxes", supports: { options: true, orientation: true }, createNode: () => base("checkbox", "Checkbox", { options: [{ label: "Option 1", value: "option_1" }] }) },
  { type: "dropdown", category: "selection", label: "Dropdown", icon: "ChevronDownSquare", description: "Single select dropdown", supports: { options: true, defaultValue: true }, createNode: () => base("dropdown", "Dropdown", { options: [{ label: "Option 1", value: "option_1" }, { label: "Option 2", value: "option_2" }] }) },
  { type: "multiselect", category: "selection", label: "Multi Select", icon: "ListChecks", description: "Multiple select dropdown", supports: { options: true }, createNode: () => base("multiselect", "Multi Select", { options: [{ label: "Option 1", value: "option_1" }, { label: "Option 2", value: "option_2" }] }) },
  { type: "toggle", category: "selection", label: "Toggle Switch", icon: "ToggleLeft", description: "On/off switch", supports: { defaultValue: true }, createNode: () => base("toggle", "Toggle") },
  { type: "yesno", category: "selection", label: "Yes / No", icon: "CheckCircle2", description: "Binary yes/no choice", supports: { defaultValue: true }, createNode: () => base("yesno", "Yes / No") },
  { type: "rating", category: "selection", label: "Rating", icon: "Star", description: "Star rating scale", supports: { minMax: true }, createNode: () => base("rating", "Rating", { meta: { max: 5 } }) },
  { type: "slider", category: "selection", label: "Slider", icon: "SlidersHorizontal", description: "Numeric range slider", supports: { minMax: true, defaultValue: true }, createNode: () => base("slider", "Slider", { meta: { min: 0, max: 100, step: 1 } }) },

  // ---------------- UPLOAD ----------------
  { type: "file", category: "upload", label: "File Upload", icon: "FileUp", description: "Generic file upload (Cloudinary)", supports: { fileConfig: true }, createNode: () => base("file", "File Upload", { meta: { maxSizeMb: 10, multiple: false, accept: "*" } }) },
  { type: "image", category: "upload", label: "Image Upload", icon: "ImageUp", description: "Image upload with preview", supports: { fileConfig: true }, createNode: () => base("image", "Image Upload", { meta: { maxSizeMb: 10, multiple: false, accept: "image/*" } }) },
  { type: "signature", category: "upload", label: "Signature Pad", icon: "PenLine", description: "Draw and capture a signature", supports: {}, createNode: () => base("signature", "Signature") },
  { type: "medicalImage", category: "upload", label: "Medical Image Upload", icon: "ScanLine", description: "DICOM / clinical image upload", supports: { fileConfig: true }, createNode: () => base("medicalImage", "Medical Image", { meta: { maxSizeMb: 50, multiple: true, accept: "image/*,.dcm" } }) },

  // ---------------- DISPLAY ----------------
  { type: "heading", category: "display", label: "Heading", icon: "Heading", description: "Section heading text", supports: {}, createNode: () => base("heading", "Heading Text") },
  { type: "paragraph", category: "display", label: "Paragraph", icon: "Pilcrow", description: "Static paragraph text", supports: {}, createNode: () => base("paragraph", "Paragraph text goes here.") },
  { type: "label", category: "display", label: "Label", icon: "Tag", description: "Inline label", supports: {}, createNode: () => base("label", "Label") },
  { type: "divider", category: "display", label: "Divider", icon: "Minus", description: "Horizontal rule", supports: {}, createNode: () => base("divider", "") },
  { type: "htmlBlock", category: "display", label: "HTML Block", icon: "Code2", description: "Rich static content block", supports: {}, createNode: () => base("htmlBlock", "", { meta: { html: "<p>Custom content</p>" } }) },
  { type: "imageDisplay", category: "display", label: "Image", icon: "Image", description: "Static image", supports: {}, createNode: () => base("imageDisplay", "") },

  // ---------------- LAYOUT ----------------
  { type: "section", category: "layout", label: "Section", icon: "Rows3", description: "Collapsible grouping container", supports: { isLayout: true }, createNode: () => base("section", "New Section", { children: [] }) },
  { type: "card", category: "layout", label: "Card", icon: "CreditCard", description: "Bordered card container", supports: { isLayout: true }, createNode: () => base("card", "Card", { children: [] }) },
  { type: "accordion", category: "layout", label: "Accordion", icon: "ChevronsUpDown", description: "Expand/collapse panel", supports: { isLayout: true }, createNode: () => base("accordion", "Accordion", { children: [] }) },
  { type: "tabs", category: "layout", label: "Tabs", icon: "PanelsTopLeft", description: "Tabbed container", supports: { isLayout: true }, createNode: () => base("tabs", "Tabs", { children: [] }) },
  { type: "row", category: "layout", label: "Row", icon: "Columns3", description: "Horizontal flex row", supports: { isLayout: true }, createNode: () => base("row", "", { children: [] }) },
  { type: "column", category: "layout", label: "Column", icon: "PanelLeft", description: "Vertical flex column", supports: { isLayout: true }, createNode: () => base("column", "", { children: [] }) },
  { type: "spacer", category: "layout", label: "Spacer", icon: "MoveVertical", description: "Empty vertical gap", supports: {}, createNode: () => base("spacer", "", { meta: { heightPx: 24 } }) },

  // ---------------- ACTION ----------------
  { type: "submit", category: "action", label: "Submit", icon: "Send", description: "Submit the form", supports: {}, createNode: () => base("submit", "Submit") },
  { type: "reset", category: "action", label: "Reset", icon: "RotateCcw", description: "Reset all fields", supports: {}, createNode: () => base("reset", "Reset") },
  { type: "cancel", category: "action", label: "Cancel", icon: "X", description: "Cancel and discard", supports: {}, createNode: () => base("cancel", "Cancel") },
  { type: "previous", category: "action", label: "Previous", icon: "ArrowLeft", description: "Go to previous section", supports: {}, createNode: () => base("previous", "Previous") },
  { type: "next", category: "action", label: "Next", icon: "ArrowRight", description: "Go to next section", supports: {}, createNode: () => base("next", "Next") },

  // ---------------- HEALTHCARE ----------------
  { type: "patientInfo", category: "healthcare", label: "Patient Information", icon: "UserRound", description: "Name, DOB, sex, MRN block", supports: {}, createNode: () => base("patientInfo", "Patient Information") },
  { type: "encounterDetails", category: "healthcare", label: "Encounter Details", icon: "Stethoscope", description: "Visit type, department, attending", supports: {}, createNode: () => base("encounterDetails", "Encounter Details") },
  { type: "vitals", category: "healthcare", label: "Vitals", icon: "HeartPulse", description: "BP, HR, Temp, SpO2, RR, weight, height", supports: {}, createNode: () => base("vitals", "Vitals") },
  { type: "allergies", category: "healthcare", label: "Allergies", icon: "ShieldAlert", description: "Allergy list with severity", supports: {}, createNode: () => base("allergies", "Allergies") },
  { type: "medications", category: "healthcare", label: "Medications", icon: "Pill", description: "Current medications list", supports: {}, createNode: () => base("medications", "Current Medications") },
  { type: "diagnosisIcd10", category: "healthcare", label: "Diagnosis (ICD-10)", icon: "ClipboardPlus", description: "Diagnosis coded to ICD-10", supports: {}, createNode: () => base("diagnosisIcd10", "Diagnosis") },
  { type: "labOrders", category: "healthcare", label: "Lab Orders", icon: "FlaskConical", description: "Laboratory test orders", supports: {}, createNode: () => base("labOrders", "Lab Orders") },
  { type: "prescription", category: "healthcare", label: "Prescription", icon: "FileText", description: "Drug, dose, frequency, duration", supports: {}, createNode: () => base("prescription", "Prescription") },
  { type: "nursingNotes", category: "healthcare", label: "Nursing Notes", icon: "NotebookPen", description: "Free-text nursing progress notes", supports: {}, createNode: () => base("nursingNotes", "Nursing Notes") },
  { type: "consent", category: "healthcare", label: "Consent", icon: "FileCheck2", description: "Consent statement with acknowledgement", supports: {}, createNode: () => base("consent", "Consent Statement") },
  { type: "doctorSignature", category: "healthcare", label: "Doctor Signature", icon: "Signature", description: "Physician signature capture", supports: {}, createNode: () => base("doctorSignature", "Doctor Signature") },
  { type: "patientSignature", category: "healthcare", label: "Patient Signature", icon: "Signature", description: "Patient signature capture", supports: {}, createNode: () => base("patientSignature", "Patient Signature") },
];

export const FIELD_REGISTRY: Record<FieldType, FieldDefinition> = Object.fromEntries(
  registryList.map((f) => [f.type, f])
) as Record<FieldType, FieldDefinition>;

export const CATEGORY_LABELS: Record<FieldCategory, string> = {
  basic: "Basic Fields",
  selection: "Selection Controls",
  upload: "Upload Components",
  display: "Display Components",
  layout: "Layout Components",
  action: "Action Components",
  healthcare: "Healthcare Components",
};

export function getFieldsByCategory(category: FieldCategory): FieldDefinition[] {
  return registryList.filter((f) => f.category === category);
}

export const ALL_CATEGORIES: FieldCategory[] = [
  "basic",
  "selection",
  "upload",
  "display",
  "layout",
  "action",
  "healthcare",
];

export const LAYOUT_TYPES: FieldType[] = registryList
  .filter((f) => f.supports.isLayout)
  .map((f) => f.type);

export function isLayoutType(type: FieldType): boolean {
  return LAYOUT_TYPES.includes(type);
}
