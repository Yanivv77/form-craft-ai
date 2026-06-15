import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for locales. To add a locale later (e.g. "he"),
 * add it to `locales` and create the matching `messages/<locale>.json` —
 * routing, the proxy matcher and navigation all derive from this.
 */
export const routing = defineRouting({
	locales: ["en"],
	defaultLocale: "en",
});
