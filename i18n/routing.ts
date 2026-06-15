import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for locales. To add a locale later (e.g. "he"),
 * add it to `locales` and create the matching `messages/<locale>.json` —
 * routing, the proxy matcher and navigation all derive from this.
 */
export const routing = defineRouting({
	locales: ["en", "he"],
	defaultLocale: "en",
});

/** Content/UI direction for a locale. Hebrew is RTL; everything else LTR. */
export function localeDirection(locale: string): "rtl" | "ltr" {
	return locale === "he" ? "rtl" : "ltr";
}
