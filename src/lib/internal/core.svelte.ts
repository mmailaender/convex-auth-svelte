/**
 * Binds a `@convex-dev/auth` {@link AuthClient} to Svelte: the counterpart of
 * `AuthProvider` and `SessionWatcher` in `@convex-dev/auth/react`. Shared by
 * `setupConvexAuth` (SPA) and `setupConvexAuthSvelteKit` (SSR), which differ
 * only in how they build the client: who holds the refresh token, and where
 * the sign-in functions run.
 *
 * @module
 */
import { getContext, setContext, untrack } from 'svelte';
import { setupAuth, useAuth as useConvexAuth, useQuery } from 'convex-svelte';
import type { ConvexClient } from 'convex/browser';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import type { AuthClient } from '@convex-dev/auth/browser';
import type { AuthSignInApi, IsAuthenticatedFn, SlimTokenBundle, TokenBundle } from './types.js';
import type { NamespacedStorage } from './storage.js';
import { createAuthChangeDetector } from './authChange.js';

const CONTEXT_KEY = Symbol('convex-auth-svelte');

/** The values the hooks and method helpers read, set by the setup functions. */
export type ConvexAuthContext = {
	authClient: AuthClient;
	/** Runs the sign-in functions of the methods. */
	signInApi: AuthSignInApi;
	/** Runs the public mutations of the methods that mint no session. */
	mutation<F extends FunctionReference<'mutation', 'public'>>(
		fn: F,
		args: FunctionArgs<F>
	): Promise<FunctionReturnType<F>>;
	/** Where the methods keep their client-side secrets. */
	storage: NamespacedStorage;
	/** The state of the `AuthClient`, as Svelte state. */
	readonly clientState: {
		readonly isLoading: boolean;
		readonly isAuthenticated: boolean;
		readonly token: string | null;
	};
};

/** Read the context set by the setup functions. Call during component init. */
export function getConvexAuthContext(caller: string): ConvexAuthContext {
	const context = getContext<ConvexAuthContext | undefined>(CONTEXT_KEY);
	if (context === undefined) {
		throw new Error(
			`${caller} must be called in a component that calls setupConvexAuth() or ` +
				'setupConvexAuthSvelteKit(), or in one below it.'
		);
	}
	return context;
}

/**
 * Hook an {@link AuthClient} into Svelte and the Convex client, and set the
 * context of the hooks and method helpers.
 *
 * Must be called during component initialization.
 */
export function bindAuthClient({
	authClient,
	convex,
	signInApi,
	storage,
	isAuthenticated,
	initialToken,
	onAuthChange
}: {
	authClient: AuthClient;
	convex: ConvexClient;
	signInApi: AuthSignInApi;
	storage: NamespacedStorage;
	/** The app's `isAuthenticated` query, watched to sign out revoked sessions. */
	isAuthenticated: IsAuthenticatedFn;
	/**
	 * The access token the server rendered with, `null` when it rendered
	 * signed out. SSR only: leave it out without SSR.
	 */
	initialToken?: string | null;
	/**
	 * Called when the client signs in, signs out or switches to another
	 * session after it has loaded. With SSR, also when it finishes loading in
	 * another session than the server rendered, e.g. after redeeming an OAuth
	 * code.
	 */
	onAuthChange?: (isAuthenticated: boolean) => void;
}): void {
	let snapshot = $state.raw(authClient.getSnapshot());
	// Every token refresh replaces the snapshot. The Convex client only needs
	// to hear about sign-in and sign-out: re-running `setupAuth`'s effect on a
	// new token calls `setAuth` again, which fetches yet another token, and
	// so on.
	const sessionLoading = $derived(snapshot.isLoading);
	const signedIn = $derived(snapshot.isAuthenticated);

	// `init()` loads the session from storage (and finishes an OAuth flow that
	// redirected back). The Convex client may ask for a token before the
	// effect below has run, so the first token fetch waits for it too.
	let initPromise: Promise<void> | undefined;
	const init = () => (initPromise ??= authClient.init());

	$effect(() =>
		// Run once. `init()` can notify the subscriber synchronously (an OAuth
		// code puts the client in a pending sign-in), and tracking the reads in
		// there would re-run this effect, which disposes the client.
		untrack(() => {
			const changed = createAuthChangeDetector(initialToken);
			const unsubscribe = authClient.subscribe(() => {
				const next = authClient.getSnapshot();
				snapshot = next;
				if (changed(next)) onAuthChange?.(next.isAuthenticated);
			});
			snapshot = authClient.getSnapshot();
			void init();
			return () => {
				unsubscribe();
				authClient.dispose();
			};
		})
	);

	const fetchAccessToken = async (args: { forceRefreshToken: boolean }) => {
		await init();
		return await authClient.fetchAccessToken(args);
	};

	// The counterpart of `ConvexProviderWithAuth`. When the server rendered
	// signed in, seeding convex-svelte with that keeps the hydrated page from
	// flashing signed out while the client loads the session.
	setupAuth(
		() => ({
			isLoading: sessionLoading,
			isAuthenticated: signedIn,
			fetchAccessToken
		}),
		initialToken != null ? { initialState: { isAuthenticated: true } } : undefined
	);
	const convexAuth = useConvexAuth();

	// The counterpart of upstream's `SessionWatcher`: watch the app's
	// `isAuthenticated` query while the backend accepts the token. When the
	// session is revoked server-side, the query flips to `false` and the client
	// signs out right away instead of at the next failed refresh.
	const session = useQuery(isAuthenticated, () => (convexAuth.isAuthenticated ? {} : 'skip'));
	$effect(() => {
		if (session.data === false) {
			void authClient.signOut();
		}
	});

	setContext<ConvexAuthContext>(CONTEXT_KEY, {
		authClient,
		signInApi,
		mutation: (fn, args) => convex.mutation(fn, args),
		storage,
		clientState: {
			get isLoading() {
				return sessionLoading;
			},
			get isAuthenticated() {
				return signedIn;
			},
			get token() {
				return snapshot.token;
			}
		}
	});
}

/** The value returned by {@link useAuthActions}. */
export type ConvexAuthActionsContextType = {
	/**
	 * Adopt a session. The method helpers call it for you; use it for a
	 * sign-in function you call yourself. A SPA client receives a full
	 * {@link TokenBundle}, a SvelteKit client the {@link SlimTokenBundle}
	 * without the refresh token.
	 */
	setSession: (session: TokenBundle | SlimTokenBundle) => Promise<void>;
	/** Sign out: revoke the session on the server and clear it locally. */
	signOut: () => Promise<void>;
};

/**
 * Access the auth actions. Call during component initialization.
 *
 * ```ts
 * const { setSession, signOut } = useAuthActions();
 * ```
 *
 * For the auth state, use `useAuth()` from `convex-svelte`, the counterpart of
 * `useConvexAuth()` from `convex/react`.
 */
export function useAuthActions(): ConvexAuthActionsContextType {
	const { authClient } = getConvexAuthContext('useAuthActions()');
	return { setSession: authClient.setSession, signOut: authClient.signOut };
}

/**
 * The current access token (a JWT), or `null` when signed out. Call during
 * component initialization, and read `current`, which stays reactive.
 *
 * Use it to authenticate requests to your Convex HTTP actions
 * (`Authorization: Bearer <token>`). Treat it as an ID token and don't send
 * it to other servers.
 */
export function useAuthToken(): { readonly current: string | null } {
	const { clientState } = getConvexAuthContext('useAuthToken()');
	return {
		get current() {
			return clientState.token;
		}
	};
}
