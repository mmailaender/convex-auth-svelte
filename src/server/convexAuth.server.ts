import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { setupConvexAuthSvelteKit } from '$lib/sveltekit/server';
import { api } from '$convex/_generated/api';

// The SvelteKit-specific server helpers: the `handle` hook (up-front refresh
// and redirects), the access token for the root layout, and the signed-in
// check. The auth routes are mounted separately, from serverAuth.ts.
export const {
	convexAuthSvelteKitHandle,
	convexAuthSvelteKitAccessToken,
	isAuthenticatedSvelteKit
} = setupConvexAuthSvelteKit({
	convexUrl: PUBLIC_CONVEX_URL,
	refreshSession: api.auth.refreshSession,
	isAuthenticated: api.auth.isAuthenticated
});
