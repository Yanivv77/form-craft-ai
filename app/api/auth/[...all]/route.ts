import { createAuth } from "@/lib/auth";
import { getEnv } from "@/lib/cf";

// Request-scoped handlers — the Better Auth instance is built per request from
// `getEnv()`, never at module scope (which would capture env at import time and
// crash on Workers). This replaces `toNextJsHandler`, which needs a module-level
// instance.
export async function GET(request: Request): Promise<Response> {
	return createAuth(getEnv()).handler(request);
}

export async function POST(request: Request): Promise<Response> {
	return createAuth(getEnv()).handler(request);
}
