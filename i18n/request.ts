import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
	// Segment first (all routes are locale-prefixed); fall back to the
	// NEXT_LOCALE cookie, then the default. There is no Accept-Language
	// negotiation — that lived in the middleware we cannot run on this runtime.
	const requested = await requestLocale;
	let locale = hasLocale(routing.locales, requested) ? requested : undefined;

	if (!locale) {
		const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
		locale = hasLocale(routing.locales, cookieLocale)
			? cookieLocale
			: routing.defaultLocale;
	}

	return {
		locale,
		messages: (await import(`../messages/${locale}.json`)).default,
	};
});
