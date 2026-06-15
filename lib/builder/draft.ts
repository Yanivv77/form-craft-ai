import type { FormDef } from "@/lib/forms/types";

// Versioned keys so a future shape change can be ignored rather than crash.
const DRAFT_KEY = "formcraft.draft.v1";
const PENDING_KEY = "formcraft.pendingSave.v1";

export interface Draft {
	form: FormDef;
	locale: string;
}

function read(key: string): Draft | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as Draft) : null;
	} catch {
		return null;
	}
}

function write(key: string, draft: Draft) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(key, JSON.stringify(draft));
	} catch {
		// Ignore quota / privacy-mode failures — the draft is a convenience.
	}
}

function remove(key: string) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(key);
	} catch {
		// ignore
	}
}

/** The live builder draft, mirrored from state on the anonymous home builder. */
export const loadDraft = () => read(DRAFT_KEY);
export const saveDraft = (draft: Draft) => write(DRAFT_KEY, draft);
export const clearDraft = () => remove(DRAFT_KEY);

/** The draft stashed across the sign-in round trip, consumed once on return. */
export const stashPendingSave = (draft: Draft) => write(PENDING_KEY, draft);
export function takePendingSave(): Draft | null {
	const draft = read(PENDING_KEY);
	if (draft) remove(PENDING_KEY);
	return draft;
}
