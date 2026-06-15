"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALES = ["en", "he"] as const;

export function LanguageSwitcher() {
	const t = useTranslations("LanguageSwitcher");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	function switchTo(next: (typeof LOCALES)[number]) {
		if (next === locale) return;
		// Remember the choice for the bare "/" entry (read by the cookie-aware
		// redirect in next.config). Then navigate to the same page in `next`.
		// biome-ignore lint/suspicious/noDocumentCookie: a single first-party locale preference cookie
		document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
		router.replace(pathname, { locale: next });
	}

	return (
		<div className="flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5">
			{LOCALES.map((code) => {
				const active = code === locale;
				return (
					<button
						key={code}
						type="button"
						aria-pressed={active}
						data-testid={`lang-${code}`}
						onClick={() => switchTo(code)}
						className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
							active
								? "bg-card text-foreground"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{code === "he" ? t("hebrew") : t("english")}
					</button>
				);
			})}
		</div>
	);
}
