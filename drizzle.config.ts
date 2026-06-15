import { defineConfig } from "drizzle-kit";

// DATABASE_URL is injected by `dotenv -e .dev.vars --` in the db:* scripts.
export default defineConfig({
	dialect: "postgresql",
	schema: "./lib/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: process.env.DATABASE_URL ?? "",
	},
});
