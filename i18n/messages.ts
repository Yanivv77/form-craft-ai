import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/** Load a locale's message catalog (relative import so the path resolves). */
export async function loadMessages(locale: string) {
	const safe = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	return (await import(`../messages/${safe}.json`)).default;
}
