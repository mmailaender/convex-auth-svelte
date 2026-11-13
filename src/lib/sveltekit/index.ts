/**
 * SvelteKit bindings for Convex Auth v2, with server-side rendering.
 *
 * The refresh token lives in an httpOnly cookie that only the SvelteKit
 * server reads. Sign-in, refresh and sign-out go through the auth routes that
 * `createConvexAuthHooks` (from `@mmailaender/convex-auth-svelte/sveltekit/server`)
 * serves, and the browser only ever holds the short-lived access token.
 *
 * @module
 */
import { invalidateAll, replaceState } from '$app/navigation';
import { ConvexHttpClient, type ConvexClient, type ConvexClientOptions } from 'convex/browser';
import { setConvexClientContext, setupConvex } from 'convex-svelte';
import { AuthClient, defaultStorage } from '@convex-dev/auth/browser';
import { bindAuthClient, type ConvexAuth } from '../internal/core.svelte.js';
import { oauth } from '../internal/oauthClient.js';
import { namespacedStorage } from '../internal/storage.js';
import type {
	AmbientSignInClient,
	AuthSignInApi,
	IsAuthenticatedFn,
	SlimTokenBundle,
	TokenStorage
} from '../internal/types.js';
import { DEFAULT_ROUTES, type ConvexAuthRoutes, type ConvexAuthServerState } from './shared.js';

export { useAuth, type ConvexAuth } from '../internal/core.svelte.js';
export { oauth } from '../internal/oauthClient.js';
export type {
	AmbientSignInClient,
	SlimTokenBundle,
	TokenBundle,
	TokenStorage
} from '../internal/types.js';
export type { ConvexAuthRoutes, ConvexAuthServerState } from './shared.js';

/** Options of {@link setupConvexAuth}. */
export type SetupConvexAuthOptions = {
	/**
	 * The server state from `getAuthState(event)` of `createConvexAuthHooks`,
	 * usually returned from the root `+layout.server.ts`.
	 */
	getServerState: () => ConvexAuthServerState;
	/**
	 * The URL of your Convex deployment, e.g.
	 * `https://small-mouse-123.convex.cloud`.
	 */
	convexUrl: string;
	/**
	 * The app's `isAuthenticated` query, as exported from `convex/auth.ts`.
	 * Passing `api.auth` works. The client watches it, so a session revoked on
	 * the server signs the browser out right away.
	 */
	api: { isAuthenticated: IsAuthenticatedFn };
	/**
	 * An existing `ConvexClient`. If omitted, one is created with
	 * `convex-svelte`'s `setupConvex(convexUrl, clientOptions)`.
	 */
	client?: ConvexClient;
	/** Options for the `ConvexClient` created when `client` is omitted. */
	clientOptions?: ConvexClientOptions;
	/**
	 * Where the auth routes are mounted. Must match the `routes` passed to
	 * `createConvexAuthHooks`. Defaults to `/auth/signin`, `/auth/refresh`
	 * and `/auth/signout`.
	 */
	routes?: Partial<ConvexAuthRoutes>;
	/**
	 * Where the access token is kept in the browser. Defaults to
	 * `localStorage`. The refresh token never leaves the httpOnly cookie.
	 */
	storage?: TokenStorage;
	/**
	 * Advanced. Sign-in methods that run on their own at startup, like
	 * finishing an OAuth flow. Replaces the default `[oauth()]`; include
	 * `oauth()` yourself to keep it.
	 */
	ambientSignIns?: AmbientSignInClient[];
	/**
	 * Re-run the `load` functions when the user signs in or out, so the
	 * server-rendered data matches the new session. Defaults to `true`.
	 */
	invalidateOnAuthChange?: boolean;
	/** Log the refresh and lifecycle steps of the session to the console. */
	verbose?: boolean;
};

/**
 * POST to the refresh or sign-out route and read back the access-only
 * session. Both routes reply with `{ tokens }` on success and failure alike,
 * so the body is parsed regardless of status.
 */
async function postAuth(route: string): Promise<{ tokens: SlimTokenBundle | null }> {
	const res = await fetch(route, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: '{}'
	});
	return (await res.json().catch(() => ({ tokens: null }))) as {
		tokens: SlimTokenBundle | null;
	};
}

/**
 * Strip the OAuth callback params from the URL. SvelteKit's `replaceState`
 * keeps its router in sync, but throws before the router has started, so the
 * plain History API is the fallback.
 */
function replaceUrl(url: string) {
	try {
		replaceState(url, {});
	} catch {
		window.history.replaceState(window.history.state, '', url);
	}
}

/**
 * Set up Convex Auth in a SvelteKit app. Call it once, in your root
 * `+layout.svelte`, in place of `setupConvex`.
 *
 * ```svelte
 * <script lang="ts">
 *   import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
 *   import { PUBLIC_CONVEX_URL } from '$env/static/public';
 *   import { api } from '$convex/_generated/api';
 *
 *   let { children, data } = $props();
 *
 *   setupConvexAuth({
 *     getServerState: () => data.authState,
 *     convexUrl: PUBLIC_CONVEX_URL,
 *     api: api.auth
 *   });
 * </script>
 *
 * {@render children()}
 * ```
 */
export function setupConvexAuth(options: SetupConvexAuthOptions): ConvexAuth {
	const { convexUrl } = options;
	const routes = { ...DEFAULT_ROUTES, ...options.routes };
	let convex: ConvexClient;
	if (options.client !== undefined) {
		convex = options.client;
		setConvexClientContext(convex);
	} else {
		convex = setupConvex(convexUrl, options.clientOptions);
	}

	const initialToken = options.getServerState().token;

	// Sign-in goes to the auth proxy route, which forwards the call to the
	// deployment and moves the minted refresh token into an httpOnly cookie.
	// It speaks the `ConvexHttpClient` wire format, so the client is a real one
	// aimed at the app. The trailing `?path=` puts the endpoint it appends in
	// the query string, so the route is static.
	const proxy = new ConvexHttpClient(`${routes.signIn}?path=`, {
		skipConvexDeploymentUrlCheck: true,
		logger: options.clientOptions?.logger
	});
	// A sign-in usually runs signed out, but a function may want the current
	// identity (e.g. to link an account), so the access token is attached per
	// call. `authClient` is read lazily because ambient sign-ins receive
	// `signInApi` while the client is being constructed.
	// eslint-disable-next-line prefer-const
	let authClient: AuthClient;
	const withAuth = () => {
		const token = authClient.getAccessToken();
		if (token !== null) proxy.setAuth(token);
		else proxy.clearAuth();
		return proxy;
	};
	const signInApi: AuthSignInApi = {
		mutation: (fn, args) => withAuth().mutation(fn, args),
		action: (fn, args) => withAuth().action(fn, args)
	};
	const tokenStorage = options.storage ?? defaultStorage();

	authClient = new AuthClient({
		mode: 'ssr',
		authApi: {
			refreshSession: async () => (await postAuth(routes.refresh)).tokens,
			signOut: async () => {
				await postAuth(routes.signOut);
			}
		},
		storage: tokenStorage,
		storageNamespace: convexUrl,
		initialAccessToken: initialToken,
		ambientSignIns: {
			signIns: options.ambientSignIns ?? [oauth()],
			signInApi,
			// Calls that mint no session, like starting an OAuth flow, go to the
			// deployment, because the proxy refuses them.
			convex: { mutation: (fn, args) => convex.mutation(fn, args) },
			replaceUrl
		},
		verbose: options.verbose
	});

	const invalidate = options.invalidateOnAuthChange ?? true;
	return bindAuthClient({
		authClient,
		convex,
		signInApi,
		storage: namespacedStorage(tokenStorage, convexUrl),
		isAuthenticated: options.api.isAuthenticated,
		initialToken,
		onAuthChange: invalidate ? () => void invalidateAll() : undefined
	});
}
