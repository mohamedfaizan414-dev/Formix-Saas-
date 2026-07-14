const Groq = require("groq-sdk");
const { nanoid } = require("nanoid");

const ALLOWED_TYPES = [
  "text", "textarea", "number", "email", "password", "phone", "date", "time", "datetime", "hidden",
  "radio", "checkbox", "dropdown", "multiselect", "toggle", "yesno", "rating", "slider",
  "file", "image", "signature", "medicalImage",
  "heading", "paragraph", "label", "divider", "htmlBlock", "imageDisplay", "inlineTemplate",
  "section", "card", "accordion", "tabs", "row", "column", "spacer",
  "submit", "reset", "cancel", "previous", "next",
  "patientInfo", "encounterDetails", "vitals", "allergies", "medications", "diagnosisIcd10", "labOrders", "prescription", "nursingNotes", "consent", "doctorSignature", "patientSignature"
];

const SYSTEM_PROMPT = `You are a healthcare forms architect. Given a short description of a
clinical or administrative form, output ONLY a JSON object (no markdown fences, no prose)
matching this shape:

{
  "title": string,
  "description": string,
  "layout": "single" | "two-column" | "three-column" | "four-column",
  "sections": [
    {
      "title": string,
      "components": [
        { "type": one of [${ALLOWED_TYPES.join(", ")}],
          "label": string,
          "internalName": string (snake_case, unique),
          "required": boolean,
          "options": [{ "label": string, "value": string }] (only for radio/checkbox/dropdown/multiselect)
        }
      ]
    }
  ]
}

Use healthcare-specific field types (vitals, allergies, medications, diagnosisIcd10, patientInfo,
encounterDetails, doctorSignature, patientSignature, consent) where clinically appropriate.
Keep field counts realistic for the described form (typically 8-30 fields across sections).`;

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  return new Groq({ apiKey });
}

async function generateFormSchemaFromPrompt(prompt) {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Groq returned an empty response");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const schema = {
    title: parsed.title || "AI Generated Form",
    description: parsed.description,
    layout: parsed.layout || "single",
    conditionalRules: [],
    sections: (parsed.sections || []).map((section) => ({
      id: nanoid(10),
      title: section.title,
      components: (section.components || [])
        .filter((c) => ALLOWED_TYPES.includes(c.type))
        .map((c) => ({
          id: nanoid(10),
          type: c.type,
          label: c.label,
          internalName: c.internalName || `${c.type}_${nanoid(4)}`,
          options: c.options,
          validation: { required: !!c.required },
          display: { width: "full" },
        })),
    })),
  };

  return schema;
}

module.exports = {
  generateFormSchemaFromPrompt,
};
