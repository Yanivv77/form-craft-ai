"use client";

import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { FieldControl } from "@/components/forms/FieldControl";
import type { FormDef } from "@/lib/forms/types";

/** Read-only render of the current FormDef — what a respondent would see. */
export function LivePreview({ form }: { form: FormDef }) {
	const t = useTranslations("Preview");
	const visible = form.fields.filter((f) => !f.hidden);

	return (
		<div
			className="rounded-lg border border-border bg-card p-6 sm:p-7"
			data-testid="live-preview"
		>
			<span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
				<Eye className="size-3.5" />
				{t("eyebrow")}
			</span>

			<h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
				{form.title || t("untitledForm")}
			</h2>
			{form.description ? (
				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
					{form.description}
				</p>
			) : null}

			{visible.length === 0 ? (
				<div className="mt-6 rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
					{t("empty")}
				</div>
			) : (
				<div className="mt-6 flex flex-col gap-5">
					{visible.map((field) => (
						<fieldset key={field.id} className="flex flex-col gap-2">
							<span className="text-sm font-medium text-foreground">
								{field.label || t("untitledQuestion")}
								{field.required ? (
									<span className="ms-1 text-destructive">*</span>
								) : null}
							</span>
							<FieldControl field={field} disabled />
						</fieldset>
					))}
				</div>
			)}
		</div>
	);
}
