import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Per-request Drizzle client over Neon's HTTP driver (one round-trip per query).
 *
 * Build it inside the request from `getEnv()` — never at module scope. Every
 * write is a single statement; if a path ever needs a real multi-statement
 * transaction, give that path a `drizzle-orm/neon-serverless` (WebSocket) client
 * instead. Better Auth does NOT need one: its Drizzle adapter has no real
 * transaction, so Better Auth runs each operation as an individual statement.
 */
export function getDb(env: CloudflareEnv) {
	return drizzle({ client: neon(env.DATABASE_URL), schema });
}

export type Db = ReturnType<typeof getDb>;
