import { expect, type Page, test } from "@playwright/test";

// A form with diverse field types for validation + export coverage.
const RICH = {
	form: {
		title: "Signup",
		description: "",
		fields: [
			{ id: "f-name", label: "Name", type: "short_text", required: true },
			{ id: "f-email", label: "Email", type: "email", required: true },
			{ id: "f-age", label: "Age", type: "number", required: false },
			{
				id: "f-tops",
				label: "Toppings",
				type: "checkbox",
				required: false,
				options: ["Cheese", "Mushroom", "Olive"],
			},
		],
	},
	locale: "en",
};

async function seedSession(page: Page, email: string) {
	const res = await page.request.post("/api/test/seed-session", {
		data: { email, name: email },
	});
	expect(res.ok(), `seed-session failed: ${res.status()}`).toBeTruthy();
}

async function createRichForm(
	page: Page,
): Promise<{ url: string; id: string }> {
	await page.route("**/api/generate", (route) => route.fulfill({ json: RICH }));
	await page.goto("/en");
	await page.getByLabel("Form idea").fill("signup form");
	await page.getByTestId("generate").click();
	await expect(page.getByLabel("Form title")).toHaveValue("Signup");
	await page.getByTestId("to-preview").click();
	await page.getByTestId("save-form").click();
	await expect(page).toHaveURL(/\/en\/forms\/[a-z0-9]+$/);
	const url = page.url();
	return { url, id: url.split("/").pop() as string };
}

test("server-side validation rejects bad submissions", async ({ page }) => {
	await seedSession(page, "owner-a@example.com");
	const { id } = await createRichForm(page);
	const post = (answers: Record<string, unknown>) =>
		page.request.post(`/api/forms/${id}/responses`, { data: { answers } });

	// invalid email
	expect((await post({ "f-name": "A", "f-email": "nope" })).status()).toBe(422);
	// checkbox option not in the allowed set
	expect(
		(
			await post({
				"f-name": "A",
				"f-email": "a@b.com",
				"f-tops": ["Pineapple"],
			})
		).status(),
	).toBe(422);
	// number that isn't a number
	expect(
		(
			await post({ "f-name": "A", "f-email": "a@b.com", "f-age": "abc" })
		).status(),
	).toBe(422);
	// array where a scalar is expected
	expect((await post({ "f-name": ["A"], "f-email": "a@b.com" })).status()).toBe(
		422,
	);
	// unknown field id
	expect(
		(await post({ "f-name": "A", "f-email": "a@b.com", "f-x": "y" })).status(),
	).toBe(422);
	// a valid submission goes through
	expect((await post({ "f-name": "A", "f-email": "a@b.com" })).status()).toBe(
		201,
	);
});

test("CSV export has a BOM, guards formula cells, and joins arrays", async ({
	page,
}) => {
	await seedSession(page, "owner-a@example.com");
	const { id } = await createRichForm(page);

	const submit = await page.request.post(`/api/forms/${id}/responses`, {
		data: {
			answers: {
				"f-name": "=cmd()",
				"f-email": "a@b.com",
				"f-tops": ["Cheese", "Olive"],
			},
		},
	});
	expect(submit.status()).toBe(201);

	const res = await page.request.get(`/api/forms/${id}/export`);
	expect(res.status()).toBe(200);
	expect(res.headers()["content-type"]).toContain("text/csv");

	const buf = await res.body();
	// UTF-8 BOM (Hebrew-safe).
	expect(buf.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBe(true);

	const text = buf.toString("utf8");
	// Formula-injection guard: '=cmd()' is neutralised with a leading quote + quoted.
	expect(text).toContain('"\'=cmd()"');
	// Checkbox array joined (and quoted because it contains a comma).
	expect(text).toContain('"Cheese, Olive"');
});

test("removed fields still appear in responses (union of columns)", async ({
	page,
}) => {
	await seedSession(page, "owner-a@example.com");
	const { url, id } = await createRichForm(page);

	const submit = await page.request.post(`/api/forms/${id}/responses`, {
		data: {
			answers: { "f-name": "Sam", "f-email": "s@b.com", "f-tops": ["Cheese"] },
		},
	});
	expect(submit.status()).toBe(201);

	// Remove the Toppings field (4th) in the editor and save.
	await page.goto(`${url}/edit`);
	const cards = page.getByTestId("field-list").locator("> div");
	await cards.nth(3).getByRole("button", { name: "Remove question" }).click();
	await page.getByTestId("to-preview").click();
	await page.getByTestId("save-form").click();
	await expect(page).toHaveURL(new RegExp(`/en/forms/${id}$`));

	// The removed column persists with its historical answer.
	await expect(page.getByTestId("responses-table")).toContainText(
		"Toppings (removed)",
	);
	await expect(page.getByTestId("responses-table")).toContainText("Cheese");

	const text = (
		await (await page.request.get(`/api/forms/${id}/export`)).body()
	).toString("utf8");
	expect(text).toContain("Toppings (removed)");
	expect(text).toContain("Cheese");
});

test("CSV export is blocked for non-owners and anonymous users", async ({
	browser,
}) => {
	const ctxA = await browser.newContext();
	const pageA = await ctxA.newPage();
	await seedSession(pageA, "owner-a@example.com");
	const { id } = await createRichForm(pageA);

	const ctxB = await browser.newContext();
	const pageB = await ctxB.newPage();
	await seedSession(pageB, "owner-b@example.com");
	expect((await pageB.request.get(`/api/forms/${id}/export`)).status()).toBe(
		404,
	);

	const ctxC = await browser.newContext();
	const pageC = await ctxC.newPage();
	expect((await pageC.request.get(`/api/forms/${id}/export`)).status()).toBe(
		401,
	);

	await ctxA.close();
	await ctxB.close();
	await ctxC.close();
});
