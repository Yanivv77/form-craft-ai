/**
 * CLI-ONLY Better Auth config, used solely by `@better-auth/cli generate` to
 * emit the Drizzle auth schema (lib/db/auth-schema.ts).
 *
 * This runs in Node (reading process.env is fine in a CLI context) and is NEVER
 * imported by runtime worker code, so the deployed Worker keeps zero
 * module-scope secrets. The runtime instance is built per-request by
 * `createAuth(env)` in lib/auth/index.ts.
 */
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(
	process.env.DATABASE_URL ?? "postgresql://user:pass@localhost/db",
);
const db = drizzle({ client: sql });

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg" }),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		},
	},
});
