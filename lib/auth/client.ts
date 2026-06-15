"use client";

import { createAuthClient } from "better-auth/react";

// Browser auth client. baseURL defaults to window.location.origin, and the
// endpoints live at /api/auth. Used for Google social sign-in and reading the
// current session in the builder's save flow.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
