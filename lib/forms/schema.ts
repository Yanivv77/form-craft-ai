import { z } from "zod";
import { FIELD_TYPES } from "@/lib/forms/types";

export const MAX_FIELDS = 12;
export const MAX_OPTIONS = 8;

export const fieldSchema = z.object({
	id: z.string().min(1),
	label: z.string().min(1),
	type: z.enum(FIELD_TYPES),
	required: z.boolean(),
	placeholder: z.string().optional(),
	options: z.array(z.string()).max(MAX_OPTIONS).optional(),
	hidden: z.boolean().optional(),
});

export const formDefSchema = z.object({
	title: z.string().min(1),
	description: z.string(),
	fields: z.array(fieldSchema).max(MAX_FIELDS),
});

export type FieldInput = z.infer<typeof fieldSchema>;
export type FormDefInput = z.infer<typeof formDefSchema>;
