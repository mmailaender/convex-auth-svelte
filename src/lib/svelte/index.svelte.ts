/**
 * Svelte bindings for Convex Auth v2: the counterpart of
 * `@convex-dev/auth/react`.
 *
 * {@link setupConvexAuth} replaces `ConvexAuthProvider`. The browser holds the
 * session: the access and refresh tokens live in `localStorage` (or the
 * storage you pass). For SvelteKit with server-side rendering, use
 * `setupConvexAuthSvelteKit` from `@mmailaender/convex-auth-svelte/sveltekit`
 * instead, which keeps the refresh token in an httpOnly cookie.
 *
 * {@link useAuthActions} and {@link useAuthToken} work under both. For the auth
 * state, use `useAuth()` from `convex-svelte`, the counterpart of
 * `useConvexAuth()` from `convex/react`.
 *
 * @module
 */
import { ConvexHttpClient, type ConvexClient, type ConvexClientOptions } from 'convex/browser';
import { setConvexClientContext, setupConvex } from 'convex-svelte';
import { AuthClient, defaultStorage } from '@convex-dev/auth/browser';
import { bindAuthClient } from '../internal/core.svelte.js';
import { oauth } from '../internal/oauthClient.js';
import { namespacedStorage } from '../internal/storage.js';
import type {
	AmbientSignInClient,
	AuthSignInApi,
	ConvexAuthApi,
	TokenStorage
} from '../internal/types.js';

export {
	useAuthActions,
	useAuthToken,
	type ConvexAuthActionsContextType
} from '../internal/core.svelte.js';
export type { ConvexAuthApi, TokenBundle, TokenStorage } from '../internal/types.js';

/** Options of {@link setupConvexAuth}. */
export type SetupConvexAuthOptions = {
	/**
	 * The URL of your Convex deployment, e.g.
	 * `https://small-mouse-123.convex.cloud`.
	 */
	convexUrl: string;
	/**
	 * The app's `refreshSession` and `signOut` mutations and its
	 * `isAuthenticated` query, as exported from `convex/auth.ts`. Passing
	 * `api.auth` works.
	 */
	api: ConvexAuthApi;
	/**
	 * An existing `ConvexClient`. If omitted, one is created with
	 * `convex-svelte`'s `setupConvex(convexUrl, clientOptions)`. Unlike
	 * `ConvexAuthProvider`, `convexUrl` is required either way, because the
	 * client of `convex-svelte` doesn't expose its URL during SSR.
	 */
	client?: ConvexClient;
	/** Options for the `ConvexClient` created when `client` is omitted. */
	clientOptions?: ConvexClientOptions;
	/**
	 * Where tokens are persisted. Defaults to `localStorage` in the browser and
	 * to memory where there is none. Use `sessionStorage` for a session per
	 * tab.
	 */
	storage?: TokenStorage;
	/**
	 * Namespace for storage keys, which decides whether tokens are shared.
	 * Non-alphanumeric characters are ignored. Defaults to `convexUrl`.
	 */
	storageNamespace?: string;
	/**
	 * Advanced. Sign-in methods that run on their own at startup, like
	 * finishing an OAuth flow. Replaces the default `[oauth()]`; include
	 * `oauth()` (from `@mmailaender/convex-auth-svelte/methods/oauth`) yourself
	 * to keep it.
	 */
	ambientSignIns?: AmbientSignInClient[];
};

/**
 * Set up Convex Auth in a single-page app: the counterpart of
 * `ConvexAuthProvider`. Call it once, in your root component, in place of
 * `setupConvex`.
 *
 * ```svelte
 * <script lang="ts">
 *   import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/svelte';
 *   import { api } from '../convex/_generated/api';
 *
 *   let { children } = $props();
 *
 *   setupConvexAuth({
 *     convexUrl: CONVEX_URL, // e.g. from your bundler's env
 *     api: api.auth
 *   });
 * </script>
 *
 * {@render children()}
 * ```
 *
 * Components below it sign in with the helpers of each method, e.g.
 * `useSignInWithUsernamePassword(api.auth)` from
 * `@mmailaender/convex-auth-svelte/methods/username-password`.
 */
export function setupConvexAuth(options: SetupConvexAuthOptions): void {
	const { convexUrl, api } = options;
	let convex: ConvexClient;
	if (options.client !== undefined) {
		convex = options.client;
		setConvexClientContext(convex);
	} else {
		convex = setupConvex(convexUrl, options.clientOptions);
	}

	// Refresh and sign-out go over a separate HTTP client. A refresh happens
	// while the websocket client is paused waiting for a token, so calling it
	// over that client would deadlock.
	const httpClient = new ConvexHttpClient(convexUrl, {
		logger: options.clientOptions?.logger
	});
	const signInApi: AuthSignInApi = {
		mutation: (fn, args) => convex.mutation(fn, args),
		action: (fn, args) => convex.action(fn, args)
	};
	const tokenStorage = options.storage ?? defaultStorage();
	const storageNamespace = options.storageNamespace ?? convexUrl;

	const authClient = new AuthClient({
		mode: 'spa',
		authApi: {
			refreshSession: (refreshToken) => httpClient.mutation(api.refreshSession, { refreshToken }),
			signOut: async (refreshToken) => {
				await httpClient.mutation(api.signOut, { refreshToken });
			}
		},
		storage: tokenStorage,
		storageNamespace,
		ambientSignIns: {
			signIns: options.ambientSignIns ?? [oauth()],
			signInApi,
			convex: { mutation: (fn, args) => convex.mutation(fn, args) }
		}
	});

	bindAuthClient({
		authClient,
		convex,
		signInApi,
		storage: namespacedStorage(tokenStorage, storageNamespace),
		isAuthenticated: api.isAuthenticated
	});
}
