import { FIELD_TYPES } from "@/lib/forms/types";

export const SYSTEM_PROMPT = `You are a form-design assistant. Given a short description, you produce a JSON form definition.

Rules:
- Respond ONLY with JSON matching the schema — no markdown fences, no commentary.
- Write the title, description, every field label, and every option in the SAME language as the user's description.
- Set "locale" to the BCP-47 code of that language (e.g. "en", "he", "es", "fr").
- Use at most 12 fields. Keep the form focused — only the questions that matter.
- Allowed field types: ${FIELD_TYPES.join(", ")}.
- Pick the most natural type per question: use email, url, number, or date when the answer is one of those; long_text for paragraph answers; select/radio for "pick one"; checkbox for "pick many".
- Every select, radio, and checkbox field must have between 2 and 8 concise options.
- Only text-like fields may include a "placeholder"; only choice fields may include "options".
- Mark a field "required" only when it is clearly essential.`;

// Gemini structured-output schema (a pruned OpenAPI subset — NOT full JSON
// Schema). Ids are assigned server-side, so the model does not return them.
export const GEMINI_RESPONSE_SCHEMA = {
	type: "object",
	properties: {
		title: { type: "string" },
		description: { type: "string" },
		locale: { type: "string" },
		fields: {
			type: "array",
			items: {
				type: "object",
				properties: {
					label: { type: "string" },
					type: { type: "string", enum: [...FIELD_TYPES] },
					required: { type: "boolean" },
					placeholder: { type: "string" },
					options: { type: "array", items: { type: "string" } },
				},
				required: ["label", "type", "required"],
				propertyOrdering: [
					"label",
					"type",
					"required",
					"placeholder",
					"options",
				],
			},
		},
	},
	required: ["title", "description", "fields"],
	propertyOrdering: ["title", "description", "locale", "fields"],
} as const;
