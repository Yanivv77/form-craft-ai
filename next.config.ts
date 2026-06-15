import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
	experimental: {
		// Enables app/global-not-found.tsx for routes that match no [locale] segment.
		globalNotFound: true,
	},
	// Locale entry redirect. We can't use next-intl middleware: Next 16 forces the
	// proxy/middleware onto the Node.js runtime, which @opennextjs/cloudflare does
	// not yet support (workers-sdk#13755). A routes-manifest redirect is built into
	// the worker and needs no middleware. It is cookie-aware (NEXT_LOCALE) but has
	// no Accept-Language negotiation — that capability lived in the middleware.
	async redirects() {
		return [
			{
				source: "/",
				has: [{ type: "cookie", key: "NEXT_LOCALE", value: "he" }],
				destination: "/he",
				permanent: false,
			},
			{ source: "/", destination: "/en", permanent: false },
		];
	},
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
initOpenNextCloudflareForDev();
