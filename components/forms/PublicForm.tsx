"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldControl } from "@/components/forms/FieldControl";
import { Button } from "@/components/ui/button";
import type { Field } from "@/lib/forms/types";

type AnswerMap = Record<string, string | string[]>;

export function PublicForm({
	formId,
	title,
	description,
	fields,
}: {
	formId: string;
	title: string;
	description: string;
	fields: Field[];
}) {
	const t = useTranslations("PublicForm");
	const visible = fields.filter((f) => !f.hidden);
	const [answers, setAnswers] = useState<AnswerMap>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);

	function setValue(id: string, value: string | string[]) {
		setAnswers((prev) => ({ ...prev, [id]: value }));
	}

	function toggleCheckbox(id: string, option: string, checked: boolean) {
		setAnswers((prev) => {
			const current = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
			const next = checked
				? [...current, option]
				: current.filter((o) => o !== option);
			return { ...prev, [id]: next };
		});
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setErrors({});
		try {
			const res = await fetch(`/api/forms/${formId}/responses`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ answers }),
			});
			if (res.status === 422) {
				const data = (await res.json()) as { errors?: Record<string, string> };
				setErrors(data.errors ?? {});
				return;
			}
			if (!res.ok) throw new Error(`Submit failed (${res.status})`);
			setDone(true);
		} catch {
			setErrors({ _form: t("error") });
		} finally {
			setSubmitting(false);
		}
	}

	if (done) {
		return (
			<div
				className="animate-rise mx-auto my-16 max-w-xl rounded-lg border border-border bg-card p-10 text-center"
				data-testid="thank-you"
			>
				<span className="mx-auto flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<CheckCircle2 className="size-7" />
				</span>
				<h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
					{t("thanksTitle")}
				</h1>
				<p className="mt-2 text-muted-foreground">{t("thanksBody")}</p>
			</div>
		);
	}

	return (
		<form
			onSubmit={onSubmit}
			className="animate-rise mx-auto my-12 max-w-xl rounded-lg border border-border bg-card p-6 sm:p-9"
		>
			<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
				{title}
			</h1>
			{description ? (
				<p className="mt-2.5 leading-relaxed text-muted-foreground">
					{description}
				</p>
			) : null}

			<div className="mt-8 flex flex-col gap-6">
				{visible.map((field) => (
					<fieldset key={field.id} className="flex flex-col gap-2">
						<label
							htmlFor={field.id}
							className="text-sm font-medium text-foreground"
						>
							{field.label}
							{field.required ? (
								<span className="ms-1 text-destructive">*</span>
							) : null}
						</label>
						<FieldControl
							field={field}
							value={answers[field.id]}
							onValue={(v) => setValue(field.id, v)}
							onToggle={(opt, checked) =>
								toggleCheckbox(field.id, opt, checked)
							}
						/>
						{errors[field.id] ? (
							<p className="text-sm text-destructive">{errors[field.id]}</p>
						) : null}
					</fieldset>
				))}
			</div>

			{errors._form ? (
				<p
					className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
					role="alert"
				>
					{errors._form}
				</p>
			) : null}

			<Button
				type="submit"
				size="lg"
				disabled={submitting}
				className="mt-8 h-11 w-full gap-2 px-6 text-[0.95rem] sm:w-auto"
			>
				{submitting ? <Loader2 className="size-4 animate-spin" /> : null}
				{submitting ? t("submitting") : t("submit")}
			</Button>
		</form>
	);
}
