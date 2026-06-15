"use client";

import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MAX_OPTIONS } from "@/lib/forms/schema";
import {
	CHOICE_TYPES,
	FIELD_TYPES,
	type Field,
	type FieldType,
	TEXT_LIKE_TYPES,
} from "@/lib/forms/types";

const controlClass = "field-input px-3.5 py-2.5 text-sm";

export function FieldEditor({
	field,
	isFirst,
	isLast,
	onChange,
	onChangeType,
	onRemove,
	onMoveUp,
	onMoveDown,
}: {
	field: Field;
	isFirst: boolean;
	isLast: boolean;
	onChange: (patch: Partial<Field>) => void;
	onChangeType: (type: FieldType) => void;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
}) {
	const t = useTranslations("FieldEditor");
	const isChoice = CHOICE_TYPES.has(field.type);
	const isTextLike = TEXT_LIKE_TYPES.has(field.type);
	const options = field.options ?? [];

	function setOption(index: number, value: string) {
		const next = [...options];
		next[index] = value;
		onChange({ options: next });
	}
	function addOption() {
		if (options.length >= MAX_OPTIONS) return;
		onChange({ options: [...options, `Option ${options.length + 1}`] });
	}
	function removeOption(index: number) {
		onChange({ options: options.filter((_, i) => i !== index) });
	}

	return (
		<div className="group rounded-lg border border-border bg-card p-4 transition-colors duration-200 hover:border-foreground/20">
			<div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
				<input
					aria-label={t("questionLabel")}
					className={`${controlClass} flex-1`}
					value={field.label}
					placeholder={t("questionPlaceholder")}
					onChange={(e) => onChange({ label: e.target.value })}
				/>
				<select
					aria-label={t("fieldType")}
					className={`${controlClass} sm:w-44`}
					value={field.type}
					onChange={(e) => onChangeType(e.target.value as FieldType)}
				>
					{FIELD_TYPES.map((type) => (
						<option key={type} value={type}>
							{t(`types.${type}`)}
						</option>
					))}
				</select>
			</div>

			{isTextLike ? (
				<input
					aria-label={t("placeholderLabel")}
					className={`${controlClass} mt-3 w-full`}
					value={field.placeholder ?? ""}
					placeholder={t("placeholderPlaceholder")}
					onChange={(e) => onChange({ placeholder: e.target.value })}
				/>
			) : null}

			{isChoice ? (
				<div className="mt-3 flex flex-col gap-2">
					{options.map((opt, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: options are positional and editable
						<div key={i} className="flex items-center gap-2">
							<span
								aria-hidden
								className="size-2 shrink-0 rounded-full border border-muted-foreground/40"
							/>
							<input
								aria-label={t("option", { n: i + 1 })}
								className={`${controlClass} flex-1`}
								value={opt}
								onChange={(e) => setOption(i, e.target.value)}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => removeOption(i)}
								disabled={options.length <= 1}
								aria-label={t("removeOption")}
							>
								<X />
							</Button>
						</div>
					))}
					<div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={addOption}
							disabled={options.length >= MAX_OPTIONS}
							className="gap-1.5 text-muted-foreground hover:text-foreground"
						>
							<Plus className="size-3.5" />
							{t("addOption")}
						</Button>
					</div>
				</div>
			) : null}

			<div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
				<label className="flex cursor-pointer items-center gap-2 text-sm text-foreground select-none">
					<input
						type="checkbox"
						className="size-4 cursor-pointer rounded accent-primary"
						checked={field.required}
						onChange={(e) => onChange({ required: e.target.checked })}
					/>
					{t("required")}
				</label>

				<div className="flex items-center gap-0.5">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onMoveUp}
						disabled={isFirst}
						aria-label={t("moveUp")}
					>
						<ArrowUp />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onMoveDown}
						disabled={isLast}
						aria-label={t("moveDown")}
					>
						<ArrowDown />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onRemove}
						aria-label={t("remove")}
						className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 />
					</Button>
				</div>
			</div>
		</div>
	);
}
