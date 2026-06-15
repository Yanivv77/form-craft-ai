import { expect, type Page, test } from "@playwright/test";

// Serial: these share the per-day usage counters, so they must not run in parallel.
test.describe.configure({ mode: "serial" });

const CACHED_FORM = {
	title: "Cached Survey",
	description: "from cache",
	fields: [
		{ id: "c1", label: "Cached question", type: "short_text", required: false },
	],
};

async function seedAbuse(page: Page, body: unknown) {
	const res = await page.request.post("/api/test/seed-abuse", { data: body });
	expect(res.ok(), `seed-abuse failed: ${res.status()}`).toBeTruthy();
}

const resetGlobal = (page: Page) =>
	seedAbuse(page, { usage: [{ scope: "global", key: "all", count: 0 }] });

test("anonymous per-IP limit returns 429 and prompts sign-in", async ({
	page,
}) => {
	await resetGlobal(page);
	await seedAbuse(page, { usage: [{ scope: "ip", count: 3 }] });

	const res = await page.request.post("/api/generate", {
		data: { prompt: "a one-off prompt for the ip limit" },
	});
	expect(res.status()).toBe(429);
	expect((await res.json()).signInPrompt).toBe(true);
});

test("the daily budget brake returns 429", async ({ page }) => {
	await seedAbuse(page, {
		usage: [{ scope: "global", key: "all", count: 500 }],
	});

	const res = await page.request.post("/api/generate", {
		data: { prompt: "a one-off prompt for the budget brake" },
	});
	expect(res.status()).toBe(429);
	expect((await res.json()).signInPrompt).toBe(false);
});

test("an identical prompt is served from cache, no Gemini call", async ({
	page,
}) => {
	await resetGlobal(page);
	await seedAbuse(page, {
		cache: { prompt: "  Cached   IDEA for the test  ", formDef: CACHED_FORM },
	});

	// Different spacing/case → same normalized hash → cache hit.
	const res = await page.request.post("/api/generate", {
		data: { prompt: "cached idea FOR the test" },
	});
	expect(res.status()).toBe(200);
	const body = await res.json();
	expect(body.cached).toBe(true);
	expect(body.form.title).toBe("Cached Survey");
});

test("an over-long prompt is rejected with a friendly message", async ({
	page,
}) => {
	const res = await page.request.post("/api/generate", {
		data: { prompt: "x".repeat(1001) },
	});
	expect(res.status()).toBe(400);
	expect((await res.json()).error).toMatch(/800 characters/);
});

test("the builder prompts sign-in past the anonymous limit", async ({
	page,
}) => {
	await resetGlobal(page);
	await seedAbuse(page, { usage: [{ scope: "ip", count: 3 }] });

	await page.goto("/en");
	await page.getByLabel("Form idea").fill("anything at all");
	await page.getByTestId("generate").click();

	await expect(page.getByTestId("gen-error")).toContainText(
		"Sign in to keep going",
	);
	await expect(page.getByTestId("gen-signin")).toBeVisible();
});
