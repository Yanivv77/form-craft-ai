import { useTranslations } from "next-intl";

/**
 * Homepage footer. Server component (no client JS): the brand name with a short
 * descriptor on one side, copyright on the other. Quiet and text-only, matching
 * the paper-warm theme. No links — there are no secondary pages to point at yet.
 */
export function Footer() {
	const t = useTranslations("Footer");
	const tHeader = useTranslations("Header");
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-border">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 py-6 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-start">
				<p className="text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{tHeader("appName")}
					</span>
					<span className="px-1.5 text-border">·</span>
					{t("tagline")}
				</p>
				<p className="text-xs text-muted-foreground">
					{t("copyright", { year: String(year) })}
				</p>
			</div>
		</footer>
	);
}
