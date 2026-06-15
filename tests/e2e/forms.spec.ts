import { expect, type Page, test } from "@playwright/test";

// Canned generation so form creation never calls Gemini.
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

/** Create + save a form via the builder; returns the owner page URL. */
async function createForm(page: Page): Promise<string> {
	await mockGenerate(page);
	await page.goto("/en");
	await page.getByLabel("Form idea").fill("event rsvp form");
	await page.getByTestId("generate").click();
	await expect(page.getByLabel("Form title")).toHaveValue("Event RSVP");
	await page.getByTestId("to-preview").click();
	await page.getByTestId("save-form").click();
	await expect(page).toHaveURL(/\/en\/forms\/[a-z0-9]+$/);
	return page.url();
}

test("public respondent submits and the owner sees the response", async ({
	page,
}) => {
	await seedSession(page, "owner-a@example.com");
	const ownerUrl = await createForm(page);

	const shareHref = await page.getByTestId("share-link").getAttribute("href");
	expect(shareHref).toMatch(/\/en\/f\/[a-z0-9]+$/);

	await page.goto(shareHref as string);
	await page.getByLabel("Your name").fill("Dana");
	await page.getByRole("radio", { name: "Yes" }).check();
	await page.getByRole("button", { name: "Submit" }).click();
	await expect(page.getByTestId("thank-you")).toBeVisible();

	await page.goto(ownerUrl);
	await expect(page.getByTestId("responses-table")).toContainText("Dana");
});

test("a required field blocks submission server-side", async ({ page }) => {
	await seedSession(page, "owner-a@example.com");
	await createForm(page);

	const shareHref = await page.getByTestId("share-link").getAttribute("href");
	await page.goto(shareHref as string);
	await page.getByRole("button", { name: "Submit" }).click();

	await expect(page.getByTestId("thank-you")).toHaveCount(0);
	await expect(page.getByText("This field is required.").first()).toBeVisible();
});

test("a different user cannot view another owner's form", async ({
	browser,
}) => {
	const ctxA = await browser.newContext();
	const pageA = await ctxA.newPage();
	await seedSession(pageA, "owner-a@example.com");
	const ownerUrlA = await createForm(pageA);

	const ctxB = await browser.newContext();
	const pageB = await ctxB.newPage();
	await seedSession(pageB, "owner-b@example.com");
	const res = await pageB.goto(ownerUrlA);
	expect(res?.status()).toBe(404);

	await ctxA.close();
	await ctxB.close();
});

test("the seed-session route requires the test flag (smoke)", async ({
	request,
}) => {
	const res = await request.get("/api/test/seed-session");
	expect(res.status()).toBe(405); // exists in test mode; GET not allowed
});
