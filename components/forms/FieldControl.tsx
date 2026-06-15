"use client";

import { useTranslations } from "next-intl";
import type { Field } from "@/lib/forms/types";

const inputClass = "field-input w-full px-3.5 py-2.5 text-sm";

const optionClass =
	"flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground transition-colors duration-200 hover:border-foreground/25 has-[:checked]:border-primary has-[:checked]:bg-primary/8 has-[:disabled]:cursor-default has-[:disabled]:hover:border-border";

/**
 * Renders a single answer control from a Field. Shared by the public form
 * (interactive) and the builder live preview (disabled). Values are addressed
 * by the field id by the caller — this component just renders the control.
 */
export function FieldControl({
	field,
	value,
	onValue,
	onToggle,
	disabled,
}: {
	field: Field;
	value?: string | string[];
	onValue?: (value: string) => void;
	onToggle?: (option: string, checked: boolean) => void;
	disabled?: boolean;
}) {
	const t = useTranslations("PublicForm");
	const text = typeof value === "string" ? value : "";
	const options = field.options ?? [];

	switch (field.type) {
		case "long_text":
			return (
				<textarea
					id={field.id}
					className={inputClass}
					rows={4}
					placeholder={field.placeholder}
					value={text}
					disabled={disabled}
					onChange={(e) => onValue?.(e.target.value)}
				/>
			);
		case "select":
			return (
				<select
					id={field.id}
					className={inputClass}
					value={text}
					disabled={disabled}
					onChange={(e) => onValue?.(e.target.value)}
				>
					<option value="">{t("select")}</option>
					{options.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>
			);
		case "radio":
			return (
				<div className="flex flex-col gap-2">
					{options.map((opt) => (
						<label key={opt} className={optionClass}>
							<input
								type="radio"
								name={field.id}
								value={opt}
								checked={text === opt}
								disabled={disabled}
								onChange={() => onValue?.(opt)}
								className="size-4 cursor-pointer accent-primary"
							/>
							{opt}
						</label>
					))}
				</div>
			);
		case "checkbox":
			return (
				<div className="flex flex-col gap-2">
					{options.map((opt) => {
						const checked = Array.isArray(value) && value.includes(opt);
						return (
							<label key={opt} className={optionClass}>
								<input
									type="checkbox"
									name={field.id}
									value={opt}
									checked={checked}
									disabled={disabled}
									onChange={(e) => onToggle?.(opt, e.target.checked)}
									className="size-4 cursor-pointer rounded accent-primary"
								/>
								{opt}
							</label>
						);
					})}
				</div>
			);
		default: {
			const inputType =
				field.type === "email"
					? "email"
					: field.type === "url"
						? "url"
						: field.type === "number"
							? "number"
							: field.type === "date"
								? "date"
								: "text";
			return (
				<input
					id={field.id}
					type={inputType}
					className={inputClass}
					placeholder={field.placeholder}
					value={text}
					disabled={disabled}
					onChange={(e) => onValue?.(e.target.value)}
				/>
			);
		}
	}
}
