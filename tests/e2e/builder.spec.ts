import { expect, type Page, test } from "@playwright/test";

// Canned generation result so the builder never calls Gemini in tests.
const CANNED = {
	form: {
		title: "Event RSVP",
		description: "Let us know if you're coming",
		fields: [
			{ id: "f-name", label: "Your name", type: "short_text", required: true },
			{
				id: "f-attend",
				label: "Will you attend?",
				type: "radio",
				required: true,
				options: ["Yes", "No"],
			},
		],
	},
	locale: "en",
};

async function mockGenerate(page: Page) {
	await page.route("**/api/generate", (route) =>
		route.fulfill({ json: CANNED }),
	);
}

async function seedSession(page: Page, email: string) {
	const res = await page.request.post("/api/test/seed-session", {
		data: { email, name: email },
	});
	expect(res.ok(), `seed-session failed: ${res.status()}`).toBeTruthy();
}

test("generate (mocked) → edit → save (seeded) → edits persist", async ({
	page,
}) => {
	await mockGenerate(page);
	await seedSession(page, "builder@example.com");

	await page.goto("/en");
	await page.getByLabel("Form idea").fill("event rsvp form");
	await page.getByTestId("generate").click();

	// Generated form populates the editor.
	await expect(page.getByLabel("Form title")).toHaveValue("Event RSVP");

	// Edit the title and the first field label.
	await page.getByLabel("Form title").fill("Birthday RSVP");
	const labels = page.getByLabel("Question label");
	await expect(labels.first()).toHaveValue("Your name");
	await labels.first().fill("Full name");

	// Continue to the preview step; it reflects the edit.
	await page.getByTestId("to-preview").click();
	await expect(
		page.getByTestId("live-preview").getByText("Full name"),
	).toBeVisible();

	// Save → lands on the owner page.
	await page.getByTestId("save-form").click();
	await expect(page).toHaveURL(/\/en\/forms\/[a-z0-9]+$/);
	const ownerUrl = page.url();
	await expect(
		page.getByRole("heading", { name: "Birthday RSVP" }),
	).toBeVisible();

	// Reopen the editor: the edits persisted.
	await page.goto(`${ownerUrl}/edit`);
	await expect(page.getByLabel("Form title")).toHaveValue("Birthday RSVP");
	await expect(page.getByLabel("Question label").first()).toHaveValue(
		"Full name",
	);
});

test("anonymous draft persists and autocompletes the save after sign-in", async ({
	page,
}) => {
	await mockGenerate(page);

	// Anonymous: generate a form; the draft is mirrored to localStorage.
	await page.goto("/en");
	await page.getByLabel("Form idea").fill("event rsvp form");
	await page.getByTestId("generate").click();
	await expect(page.getByLabel("Form title")).toHaveValue("Event RSVP");

	const draft = await page.evaluate(() =>
		window.localStorage.getItem("formcraft.draft.v1"),
	);
	expect(draft).toContain("Event RSVP");

	// Simulate the save→sign-in round trip: stash the pending draft (as the Save
	// button does), establish a session, and return with ?save=1.
	await page.evaluate(() => {
		const d = window.localStorage.getItem("formcraft.draft.v1");
		if (d) window.localStorage.setItem("formcraft.pendingSave.v1", d);
	});
	await seedSession(page, "anon-builder@example.com");
	await page.goto("/en?save=1");

	// The builder auto-completes the save and redirects to the owner page.
	await expect(page).toHaveURL(/\/en\/forms\/[a-z0-9]+$/);
	await expect(page.getByRole("heading", { name: "Event RSVP" })).toBeVisible();

	// The pending stash was consumed.
	const pending = await page.evaluate(() =>
		window.localStorage.getItem("formcraft.pendingSave.v1"),
	);
	expect(pending).toBeNull();
});

test("a different user cannot open another owner's edit page", async ({
	browser,
}) => {
	const ctxA = await browser.newContext();
	const pageA = await ctxA.newPage();
	await mockGenerate(pageA);
	await seedSession(pageA, "builder@example.com");
	await pageA.goto("/en");
	await pageA.getByLabel("Form idea").fill("rsvp");
	await pageA.getByTestId("generate").click();
	await expect(pageA.getByLabel("Form title")).toHaveValue("Event RSVP");
	await pageA.getByTestId("to-preview").click();
	await pageA.getByTestId("save-form").click();
	await expect(pageA).toHaveURL(/\/en\/forms\/[a-z0-9]+$/);
	const editUrl = `${pageA.url()}/edit`;

	const ctxB = await browser.newContext();
	const pageB = await ctxB.newPage();
	await seedSession(pageB, "intruder@example.com");
	const res = await pageB.goto(editUrl);
	expect(res?.status()).toBe(404);

	await ctxA.close();
	await ctxB.close();
});
