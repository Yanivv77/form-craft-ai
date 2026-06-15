import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/**
 * Locale-aware navigation. Import { Link, redirect, usePathname, useRouter }
 * from here instead of "next/link" / "next/navigation" so the active locale
 * prefix is applied automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
	createNavigation(routing);
