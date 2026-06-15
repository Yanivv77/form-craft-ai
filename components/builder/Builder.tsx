"use client";

import {
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Loader2,
	Plus,
	Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { FieldEditor } from "@/components/builder/FieldEditor";
import { LivePreview } from "@/components/builder/LivePreview";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient, useSession } from "@/lib/auth/client";
import {
	clearDraft,
	loadDraft,
	saveDraft,
	stashPendingSave,
	takePendingSave,
} from "@/lib/builder/draft";
import { saveForm, updateForm } from "@/lib/forms/actions";
import { MAX_FIELDS } from "@/lib/forms/schema";
import {
	CHOICE_TYPES,
	type Field,
	type FieldType,
	type FormDef,
	TEXT_LIKE_TYPES,
} from "@/lib/forms/types";
import { newFieldId } from "@/lib/ids";

const controlClass = "field-input px-3.5 py-2.5 text-sm";

type Step = "create" | "edit" | "preview";

function defaultField(): Field {
	return { id: newFieldId(), label: "", type: "short_text", required: false };
}

export function Builder({
	locale,
	initialForm,
	initialLocale,
	formId,
}: {
	locale: string;
	initialForm?: FormDef;
	initialLocale?: string;
	formId?: string;
}) {
	const t = useTranslations("Builder");
	const tHeader = useTranslations("Header");
	const router = useRouter();
	const { data: session } = useSession();
	const isEditing = Boolean(formId);

	const [form, setForm] = useState<FormDef>(
		initialForm ?? { title: t("untitledTitle"), description: "", fields: [] },
	);
	const [contentLocale, setContentLocale] = useState(initialLocale ?? locale);
	const [step, setStep] = useState<Step>(isEditing ? "edit" : "create");
	const [idea, setIdea] = useState("");
	const [generating, setGenerating] = useState(false);
	const [genError, setGenError] = useState<string | null>(null);
	const [signInNeeded, setSignInNeeded] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const hydrated = useRef(false);

	// Hydrate the anonymous draft, and finish a save that was interrupted by the
	// sign-in round trip (return URL carries ?save=1).
	useEffect(() => {
		if (isEditing || hydrated.current) return;
		hydrated.current = true;

		const returning =
			new URLSearchParams(window.location.search).get("save") === "1";

		if (!returning) {
			const draft = loadDraft();
			if (draft) {
				setForm(draft.form);
				setContentLocale(draft.locale);
				// A draft with real questions resumes on the editor, not the blank
				// create card.
				if (draft.form.fields.some((f) => !f.hidden)) setStep("edit");
			}
			return;
		}

		setStep("preview");
		(async () => {
			const session = await authClient.getSession();
			const pending = takePendingSave();
			if (session.data && pending) {
				const res = await saveForm({
					form: pending.form,
					locale: pending.locale,
				});
				if ("id" in res) {
					clearDraft();
					router.push(`/forms/${res.id}`);
					return;
				}
				setSaveError(res.error);
			}
			window.history.replaceState({}, "", window.location.pathname);
			const draft = pending ?? loadDraft();
			if (draft) {
				setForm(draft.form);
				setContentLocale(draft.locale);
			}
		})();
	}, [isEditing, router]);

	// Mirror the home builder to localStorage on every change.
	useEffect(() => {
		if (isEditing || !hydrated.current) return;
		saveDraft({ form, locale: contentLocale });
	}, [form, contentLocale, isEditing]);

	function updateFieldById(id: string, patch: Partial<Field>) {
		setForm((f) => ({
			...f,
			fields: f.fields.map((fld) =>
				fld.id === id ? { ...fld, ...patch } : fld,
			),
		}));
	}

	function changeTypeById(id: string, type: FieldType) {
		setForm((f) => ({
			...f,
			fields: f.fields.map((fld) => {
				if (fld.id !== id) return fld;
				const next: Field = { ...fld, type };
				if (CHOICE_TYPES.has(type)) {
					next.options =
						fld.options && fld.options.length >= 2
							? fld.options
							: ["Option 1", "Option 2"];
				} else {
					next.options = undefined;
				}
				if (!TEXT_LIKE_TYPES.has(type)) next.placeholder = undefined;
				return next;
			}),
		}));
	}

	function addField() {
		setForm((f) => {
			if (f.fields.filter((x) => !x.hidden).length >= MAX_FIELDS) return f;
			return { ...f, fields: [...f.fields, defaultField()] };
		});
	}

	function removeFieldById(id: string) {
		setForm((f) => {
			// Existing forms soft-delete (keep response ids resolvable); new ones drop.
			if (isEditing) {
				return {
					...f,
					fields: f.fields.map((fld) =>
						fld.id === id ? { ...fld, hidden: true } : fld,
					),
				};
			}
			return { ...f, fields: f.fields.filter((fld) => fld.id !== id) };
		});
	}

	function moveFieldById(id: string, dir: -1 | 1) {
		setForm((f) => {
			const visible = f.fields.filter((x) => !x.hidden);
			const hidden = f.fields.filter((x) => x.hidden);
			const idx = visible.findIndex((x) => x.id === id);
			const target = idx + dir;
			if (idx < 0 || target < 0 || target >= visible.length) return f;
			const reordered = [...visible];
			[reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
			return { ...f, fields: [...reordered, ...hidden] };
		});
	}

	async function onGenerate() {
		if (!idea.trim() || generating) return;
		setGenerating(true);
		setGenError(null);
		setSignInNeeded(false);
		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ prompt: idea }),
			});
			const data = (await res.json()) as {
				form?: FormDef;
				locale?: string;
				error?: string;
				signInPrompt?: boolean;
			};
			if (!res.ok || !data.form) {
				setGenError(data.error ?? t("genericError"));
				setSignInNeeded(Boolean(data.signInPrompt));
				return;
			}
			setForm(data.form);
			setContentLocale(data.locale ?? locale);
			setStep("edit");
		} catch {
			setGenError(t("networkError"));
		} finally {
			setGenerating(false);
		}
	}

	async function onSave() {
		if (saving) return;
		setSaving(true);
		setSaveError(null);
		try {
			if (isEditing && formId) {
				const res = await updateForm({
					id: formId,
					form,
					locale: contentLocale,
				});
				if ("error" in res) {
					setSaveError(res.error);
					return;
				}
				router.push(`/forms/${formId}`);
				return;
			}

			const session = await authClient.getSession();
			if (session.data) {
				const res = await saveForm({ form, locale: contentLocale });
				if ("error" in res) {
					setSaveError(res.error);
					return;
				}
				clearDraft();
				router.push(`/forms/${res.id}`);
				return;
			}

			// Anonymous: stash the draft, sign in, then auto-complete on return.
			stashPendingSave({ form, locale: contentLocale });
			await authClient.signIn.social({
				provider: "google",
				callbackURL: `/${locale}?save=1`,
			});
		} catch {
			setSaveError(t("saveError"));
		} finally {
			setSaving(false);
		}
	}

	const visibleFields = form.fields.filter((f) => !f.hidden);
	const canPreview = visibleFields.length > 0;
	const signedIn = Boolean(session);
	const examples = t.raw("examples") as string[];

	// Quiet category chips — neutral, matching the brand's single cobalt accent.
	const pill = (cls: string) => (chunks: ReactNode) => (
		<span className={`rounded-md px-1.5 py-0.5 font-medium ${cls}`}>
			{chunks}
		</span>
	);
	const chip = pill("bg-secondary text-secondary-foreground");

	function goTo(s: Step) {
		if (s === "preview" && !canPreview) return;
		setStep(s);
	}

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
			{step === "create" ? (
				<section className="flex flex-1 flex-col items-center justify-center text-center">
					<h1
						className="animate-rise max-w-3xl text-[2.25rem] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-[3.25rem] sm:leading-[1.02]"
						style={{ animationDelay: "0ms" }}
					>
						{t.rich("heroTitle", {
							accent: (c) => <span className="text-primary">{c}</span>,
						})}
					</h1>
					<p
						className="animate-rise mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-muted-foreground"
						style={{ animationDelay: "70ms" }}
					>
						{t.rich("heroTagline", {
							survey: chip,
							signup: chip,
							quiz: chip,
							feedback: chip,
						})}
					</p>

					{/* Prompt box — the centerpiece. Borderless textarea inside a single
					    framed surface with a circular cobalt send. */}
					<div
						className="animate-rise mt-7 w-full max-w-2xl rounded-lg border border-border bg-card text-start transition-colors duration-200 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
						style={{ animationDelay: "150ms" }}
					>
						<textarea
							aria-label={t("ideaLabel")}
							className="w-full resize-none bg-transparent px-5 pt-5 pb-2 text-base text-foreground outline-none placeholder:text-muted-foreground/80"
							rows={3}
							placeholder={t("ideaPlaceholder")}
							value={idea}
							onChange={(e) => setIdea(e.target.value)}
							onKeyDown={(e) => {
								if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onGenerate();
							}}
						/>
						<div className="flex items-center justify-between gap-3 px-4 pt-1 pb-4">
							<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
								<Sparkles className="size-3.5" />
								{t("inputHint")}
							</span>
							<Button
								type="button"
								size="icon"
								className="size-10 rounded-full"
								onClick={onGenerate}
								disabled={generating || !idea.trim()}
								aria-label={t("generate")}
								data-testid="generate"
							>
								{generating ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<ArrowUp className="size-4" />
								)}
							</Button>
						</div>
					</div>

					{genError ? (
						<p
							className="animate-rise mt-3.5 text-sm text-destructive"
							data-testid="gen-error"
						>
							{genError}
						</p>
					) : null}
					{signInNeeded ? (
						<Button
							type="button"
							variant="outline"
							className="mt-3.5"
							onClick={() =>
								authClient.signIn.social({
									provider: "google",
									callbackURL: `/${locale}`,
								})
							}
							data-testid="gen-signin"
						>
							{tHeader("signIn")}
						</Button>
					) : null}

					<div
						className="animate-rise mt-6 flex flex-wrap items-center justify-center gap-2"
						style={{ animationDelay: "230ms" }}
					>
						<span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
							{t("examplesLabel")}
							<ArrowRight className="size-3.5 rtl:rotate-180" />
						</span>
						{examples.map((ex) => (
							<button
								key={ex}
								type="button"
								onClick={() => setIdea(ex)}
								className="cursor-pointer rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:border-foreground/25 hover:bg-secondary hover:text-foreground active:translate-y-px"
							>
								{ex}
							</button>
						))}
					</div>

					<button
						type="button"
						onClick={() => goTo("edit")}
						className="animate-rise mt-5 cursor-pointer text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
						style={{ animationDelay: "290ms" }}
					>
						{t("buildManually")}
					</button>

					<p
						className="animate-rise mt-5 text-xs text-muted-foreground"
						style={{ animationDelay: "340ms" }}
					>
						{t("noAccountHint")}
					</p>
				</section>
			) : null}

			{step === "edit" ? (
				<section className="animate-rise flex flex-col gap-4">
					<div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
						<input
							aria-label={t("titleLabel")}
							className="field-input w-full px-3.5 py-2.5 text-lg font-semibold"
							value={form.title}
							placeholder={t("titlePlaceholder")}
							onChange={(e) =>
								setForm((f) => ({ ...f, title: e.target.value }))
							}
						/>
						<textarea
							aria-label={t("descriptionLabel")}
							className={`${controlClass} w-full resize-none`}
							rows={2}
							value={form.description}
							placeholder={t("descriptionPlaceholder")}
							onChange={(e) =>
								setForm((f) => ({ ...f, description: e.target.value }))
							}
						/>
					</div>

					<div className="flex items-center justify-between px-1 pt-1">
						<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							{t("questions")}
						</p>
						<span className="text-xs tabular-nums text-muted-foreground">
							{visibleFields.length} / {MAX_FIELDS}
						</span>
					</div>

					<div className="flex flex-col gap-3" data-testid="field-list">
						{visibleFields.map((field, i) => (
							<FieldEditor
								key={field.id}
								field={field}
								isFirst={i === 0}
								isLast={i === visibleFields.length - 1}
								onChange={(patch) => updateFieldById(field.id, patch)}
								onChangeType={(type) => changeTypeById(field.id, type)}
								onRemove={() => removeFieldById(field.id)}
								onMoveUp={() => moveFieldById(field.id, -1)}
								onMoveDown={() => moveFieldById(field.id, 1)}
							/>
						))}
					</div>

					<Button
						type="button"
						variant="outline"
						onClick={addField}
						disabled={visibleFields.length >= MAX_FIELDS}
						className="h-11 w-full gap-2 border-dashed text-muted-foreground hover:text-foreground"
					>
						<Plus className="size-4" />
						{t("addQuestion")}
					</Button>

					<div
						className={`mt-2 flex items-center gap-3 ${
							isEditing ? "justify-end" : "justify-between"
						}`}
					>
						{!isEditing ? (
							<Button
								type="button"
								variant="ghost"
								onClick={() => goTo("create")}
								className="gap-2"
							>
								<ArrowLeft className="size-4 rtl:rotate-180" />
								{t("back")}
							</Button>
						) : null}
						<Button
							type="button"
							onClick={() => goTo("preview")}
							disabled={!canPreview}
							className="h-11 gap-2 px-5 text-[0.95rem]"
							data-testid="to-preview"
						>
							{t("continueToPreview")}
							<ArrowRight className="size-4 rtl:rotate-180" />
						</Button>
					</div>
				</section>
			) : null}

			{step === "preview" ? (
				<section className="animate-rise flex flex-col gap-5">
					<LivePreview form={form} />
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between gap-3">
							<Button
								type="button"
								variant="ghost"
								onClick={() => goTo("edit")}
								className="gap-2"
							>
								<ArrowLeft className="size-4 rtl:rotate-180" />
								{t("backToEdit")}
							</Button>
							<Button
								type="button"
								onClick={onSave}
								disabled={saving}
								className="h-11 gap-2 px-6 text-[0.95rem]"
								data-testid="save-form"
							>
								{saving ? <Loader2 className="size-4 animate-spin" /> : null}
								{saving
									? t("saving")
									: isEditing
										? t("saveChanges")
										: signedIn
											? t("save")
											: t("saveSignIn")}
							</Button>
						</div>
						{!signedIn && !isEditing ? (
							<p className="text-end text-xs text-muted-foreground">
								{t("saveHint")}
							</p>
						) : null}
						{saveError ? (
							<p
								className="text-end text-sm text-destructive"
								data-testid="save-error"
							>
								{saveError}
							</p>
						) : null}
					</div>
				</section>
			) : null}
		</div>
	);
}
