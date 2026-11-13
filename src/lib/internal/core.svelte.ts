/**
 * Binds a `@convex-dev/auth` {@link AuthClient} to Svelte. Shared by the SPA
 * (`/svelte`) and the SvelteKit (`/sveltekit`) entry points, which differ only
 * in how they build the client: who holds the refresh token, and where the
 * sign-in functions run.
 *
 * @module
 */
import { getContext, setContext } from 'svelte';
import { setupAuth, useAuth as useConvexAuth, useQuery } from 'convex-svelte';
import type { ConvexClient } from 'convex/browser';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import type { AuthClient } from '@convex-dev/auth/browser';
import type { AuthSignInApi, IsAuthenticatedFn, SlimTokenBundle, TokenBundle } from './types.js';
import type { NamespacedStorage } from './storage.js';

const CONTEXT_KEY = Symbol('convex-auth-svelte');

/** The values the method helpers need, provided by `setupConvexAuth`. */
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

/** Read the context set by `setupConvexAuth`. Call during component init. */
export function getConvexAuthContext(caller: string): ConvexAuthContext {
	const context = getContext<ConvexAuthContext | undefined>(CONTEXT_KEY);
	if (context === undefined) {
		throw new Error(
			`${caller} must be called in a component below the one that calls setupConvexAuth().`
		);
	}
	return context;
}

/** The value returned by `setupConvexAuth` and `useAuth`. */
export type ConvexAuth = {
	/**
	 * `true` until the session has been loaded, and while a sign-in completes
	 * without a user action on the page (e.g. an OAuth redirect coming back),
	 * or while the backend has not yet confirmed a new token.
	 */
	readonly isLoading: boolean;
	/** Whether the Convex backend has confirmed the current access token. */
	readonly isAuthenticated: boolean;
	/**
	 * The current access token (a JWT), or `null`. Use it to authenticate
	 * requests to your Convex HTTP actions (`Authorization: Bearer <token>`).
	 * Treat it as an ID token and do not send it to other servers.
	 */
	readonly token: string | null;
	/** Revoke the session on the server and clear it locally. */
	signOut(): Promise<void>;
	/**
	 * Adopt the session a sign-in function returned. The method helpers call
	 * it for you; use it for a sign-in function you call yourself.
	 */
	setSession(session: TokenBundle | SlimTokenBundle): Promise<void>;
	/**
	 * Returns the access token, refreshing it first when `forceRefreshToken`
	 * is `true`.
	 */
	fetchAccessToken(args: { forceRefreshToken: boolean }): Promise<string | null>;
};

/**
 * Hook an {@link AuthClient} into Svelte and the Convex client, and provide
 * the context of the method helpers.
 *
 * Must be called during component initialization.
 */
export function bindAuthClient({
	authClient,
	convex,
	signInApi,
	storage,
	isAuthenticated,
	initialToken = null,
	onAuthChange
}: {
	authClient: AuthClient;
	convex: ConvexClient;
	signInApi: AuthSignInApi;
	storage: NamespacedStorage;
	/** The app's `isAuthenticated` query, watched to sign out revoked sessions. */
	isAuthenticated: IsAuthenticatedFn;
	/** The access token the server rendered with (SSR only). */
	initialToken?: string | null;
	/** Called when the client signs in or out after it has loaded. */
	onAuthChange?: (isAuthenticated: boolean) => void;
}): ConvexAuth {
	let snapshot = $state(authClient.getSnapshot());

	// `init()` loads the session from storage (and finishes an OAuth flow that
	// redirected back). The Convex client may ask for a token before the
	// effect below has run, so the first token fetch waits for it too.
	let initPromise: Promise<void> | undefined;
	const init = () => (initPromise ??= authClient.init());

	$effect(() => {
		let wasAuthenticated: boolean | undefined;
		const unsubscribe = authClient.subscribe(() => {
			snapshot = authClient.getSnapshot();
			if (!snapshot.isLoading) {
				if (wasAuthenticated !== undefined && wasAuthenticated !== snapshot.isAuthenticated) {
					onAuthChange?.(snapshot.isAuthenticated);
				}
				wasAuthenticated = snapshot.isAuthenticated;
			}
		});
		snapshot = authClient.getSnapshot();
		void init();
		return () => {
			unsubscribe();
			authClient.dispose();
		};
	});

	const fetchAccessToken = async (args: { forceRefreshToken: boolean }) => {
		await init();
		return await authClient.fetchAccessToken(args);
	};

	// The server rendered signed in when it had a token. Seeding convex-svelte
	// with that keeps the hydrated page from flashing signed out while the
	// client loads the session.
	setupAuth(
		() => ({
			isLoading: snapshot.isLoading,
			isAuthenticated: snapshot.isAuthenticated,
			fetchAccessToken
		}),
		initialToken !== null ? { initialState: { isAuthenticated: true } } : undefined
	);
	const convexAuth = useConvexAuth();

	// Watch the app's `isAuthenticated` query while the backend accepts the
	// token. When the session is revoked server-side (a sign-out elsewhere, a
	// password reset), the query flips to `false` and this client signs out
	// right away instead of at the next failed refresh.
	const session = useQuery(isAuthenticated, () => (convexAuth.isAuthenticated ? {} : 'skip'));
	$effect(() => {
		if (session.data === false) {
			void authClient.signOut();
		}
	});

	const context: ConvexAuthContext = {
		authClient,
		signInApi,
		mutation: (fn, args) => convex.mutation(fn, args),
		storage,
		clientState: {
			get isLoading() {
				return snapshot.isLoading;
			},
			get isAuthenticated() {
				return snapshot.isAuthenticated;
			},
			get token() {
				return snapshot.token;
			}
		}
	};
	setContext(CONTEXT_KEY, context);

	return authFromContext(context, convexAuth);
}

/** Build the public {@link ConvexAuth} view of a context. */
export function authFromContext(
	context: ConvexAuthContext,
	convexAuth: { readonly isLoading: boolean; readonly isAuthenticated: boolean }
): ConvexAuth {
	const { authClient } = context;
	return {
		get isLoading() {
			return context.clientState.isLoading || convexAuth.isLoading;
		},
		get isAuthenticated() {
			return convexAuth.isAuthenticated;
		},
		get token() {
			return context.clientState.token;
		},
		signOut: () => authClient.signOut(),
		setSession: (session) => authClient.setSession(session),
		fetchAccessToken: (args) => authClient.fetchAccessToken(args)
	};
}

/**
 * The auth state and actions. Call during the initialization of a component
 * below the one that calls `setupConvexAuth`.
 *
 * Read the properties (don't destructure `isLoading`, `isAuthenticated` or
 * `token`), so they stay reactive:
 *
 * ```svelte
 * <script>
 *   const auth = useAuth();
 * </script>
 *
 * {#if auth.isAuthenticated}
 *   <button onclick={() => auth.signOut()}>Sign out</button>
 * {/if}
 * ```
 */
export function useAuth(): ConvexAuth {
	return authFromContext(getConvexAuthContext('useAuth()'), useConvexAuth());
}
