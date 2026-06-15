import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createAuth } from "@/lib/auth";
import { getEnv } from "@/lib/cf";

/** The authenticated user for this request, or null. Safe to call anywhere. */
export async function getOptionalUser() {
	const auth = createAuth(getEnv());
	const session = await auth.api.getSession({ headers: await headers() });
	return session?.user ?? null;
}

/**
 * Require a signed-in user. In page / Server Action contexts this redirects
 * signed-out users to the locale's `/signin` page, which starts Google sign-in
 * and returns them to `next` (the forms dashboard by default) afterwards.
 * API routes that need a JSON 401 should call `getOptionalUser()` and branch.
 */
export async function requireUser(next?: string) {
	const user = await getOptionalUser();
	if (!user) {
		const locale = await getLocale();
		const target = next ?? `/${locale}/forms`;
		redirect(`/${locale}/signin?next=${encodeURIComponent(target)}`);
	}
	return user;
}
