/**
 * Server bindings for Convex Auth v2 on SvelteKit.
 *
 * {@link createConvexAuthHooks} returns a `handle` hook that serves the auth
 * routes (sign-in proxy, refresh, sign-out), refreshes the session cookies of
 * every other request up front, and runs the request with the access token
 * set for `convex-svelte`'s server helpers. The route handlers themselves are
 * the framework-agnostic ones from `@convex-dev/auth/ssr`.
 *
 * @module
 */
import { dev } from '$app/environment';
import type { Cookies, Handle, RequestEvent } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { withServerConvexToken } from 'convex-svelte/sveltekit/server';
import {
	AUTH_JWT_COOKIE,
	ServerAuthSession,
	createServerAuthChecker,
	isTokenExpiring,
	setupConvexAuthServer,
	type AuthCookieOptions,
	type CookieStore,
	type ExposedSignInFn
} from '@convex-dev/auth/ssr';
import type { ConvexAuthApi } from '../../internal/types.js';
import { DEFAULT_ROUTES, type ConvexAuthRoutes, type ConvexAuthServerState } from '../shared.js';
import { createRouteMatcher, type RouteMatcherFn, type RouteMatcherParam } from './routeMatcher.js';

export { createRouteMatcher, type RouteMatcherFn, type RouteMatcherParam };
export type { ConvexAuthRoutes, ConvexAuthServerState };

/** Options of {@link createConvexAuthHooks}. */
export type ConvexAuthHooksOptions = {
	/** The URL of the Convex deployment. */
	convexUrl: string;
	/**
	 * The app's `refreshSession` and `signOut` mutations and its
	 * `isAuthenticated` query, as exported from `convex/auth.ts`. Passing
	 * `api.auth` works.
	 */
	api: ConvexAuthApi;
	/**
	 * Every function of the app that signs a user in (creates a session and
	 * returns its tokens), e.g. `api.auth.signInWithUsernamePassword` or
	 * `api.auth.completeSignInWithGithub`. The sign-in route refuses anything
	 * else, so this list is its whole API.
	 */
	signIn: ExposedSignInFn[];
	/**
	 * Attributes of the auth cookies. `secure` defaults to `true` outside of
	 * `vite dev`.
	 */
	cookieOptions?: Partial<AuthCookieOptions>;
	/**
	 * Origins besides the request's own `Host` that the auth routes accept
	 * POSTs from, for deployments where the two differ (e.g. a proxy that
	 * rewrites `Host`).
	 */
	allowedOrigins?: string[];
	/**
	 * Where the auth routes are mounted. Pass the same value to the client's
	 * `setupConvexAuth`. Defaults to `/auth/signin`, `/auth/refresh` and
	 * `/auth/signout`.
	 */
	routes?: Partial<ConvexAuthRoutes>;
	/** Log failed refreshes to the console. */
	verbose?: boolean;
};

/** A {@link CookieStore} over SvelteKit's `event.cookies`. */
function kitCookieStore(cookies: Cookies): CookieStore {
	return {
		// A cookie deleted earlier in this request reads back as "".
		get: (name) => cookies.get(name) || undefined,
		set: (name, value, options) =>
			cookies.set(name, value, { ...options, path: options?.path ?? '/' }),
		delete: (name, options) => cookies.delete(name, { ...options, path: options?.path ?? '/' })
	};
}

/**
 * Configure Convex Auth on the server once and get back the hook and the
 * helpers that load functions use.
 *
 * ```ts
 * // src/hooks.server.ts
 * import { createConvexAuthHooks } from '@mmailaender/convex-auth-svelte/sveltekit/server';
 * import { PUBLIC_CONVEX_URL } from '$env/static/public';
 * import { api } from '$convex/_generated/api';
 *
 * export const { handleAuth: handle, getAuthState, isAuthenticated } = createConvexAuthHooks({
 *   convexUrl: PUBLIC_CONVEX_URL,
 *   api: api.auth,
 *   signIn: [api.auth.signInWithUsernamePassword, api.auth.signUpWithUsernamePassword]
 * });
 * ```
 */
export function createConvexAuthHooks(options: ConvexAuthHooksOptions) {
	const { convexUrl, api } = options;
	const routes = { ...DEFAULT_ROUTES, ...options.routes };
	const cookieOptions: AuthCookieOptions = {
		...options.cookieOptions,
		secure: options.cookieOptions?.secure ?? !dev
	};

	const handlers = setupConvexAuthServer({
		convexUrl,
		refreshSession: api.refreshSession,
		signOut: api.signOut,
		signIn: options.signIn,
		cookieOptions,
		allowedOrigins: options.allowedOrigins
	});
	const routeHandlers = new Map([
		[routes.signIn, handlers.convexProxyHandler],
		[routes.refresh, handlers.refreshHandler],
		[routes.signOut, handlers.signOutHandler]
	]);

	const httpClient = new ConvexHttpClient(convexUrl);
	const checkAuthenticated = createServerAuthChecker({
		convexUrl,
		isAuthenticated: api.isAuthenticated
	});

	// The access token of each request, as `handleAuth` left it after the
	// up-front refresh, and the memoized backend check. Keyed by the request,
	// which the hook and the load functions of one request share.
	const tokens = new WeakMap<Request, string | null>();
	const authChecks = new WeakMap<Request, Promise<boolean>>();

	/**
	 * The `handle` hook. Serves the auth routes, refreshes the session of every
	 * other request when its access token is close to expiry (rotating the
	 * cookies), and resolves the request with the token set for
	 * `convex-svelte`'s `createConvexHttpClient()` and `convexLoad()`.
	 *
	 * Combine it with your own hooks with `sequence(handleAuth, ...)`.
	 */
	const handleAuth: Handle = async ({ event, resolve }) => {
		const routeHandler =
			event.request.method === 'POST' ? routeHandlers.get(event.url.pathname) : undefined;
		if (routeHandler !== undefined) {
			return await routeHandler(event.request);
		}

		const session = new ServerAuthSession({
			refreshSession: (refreshToken) => httpClient.mutation(api.refreshSession, { refreshToken }),
			cookies: kitCookieStore(event.cookies),
			cookieOptions
		});
		let token: string | null;
		try {
			token = await session.getToken();
		} catch (error) {
			// The deployment is unreachable. Render signed out rather than fail
			// the page, and leave the cookies for the next request to retry.
			if (options.verbose) {
				console.error('[convex-auth-svelte] Refreshing the session failed:', error);
			}
			token = null;
		}
		tokens.set(event.request, token);
		return await withServerConvexToken(token ?? undefined, () => resolve(event));
	};

	/**
	 * The access token of the request, or `null`. It is only checked for
	 * expiry, not verified: use it to authenticate calls to Convex, which
	 * verifies it. To decide whether the request is signed in, use
	 * {@link isAuthenticated}.
	 */
	function getAccessToken(event: RequestEvent): string | null {
		const token = tokens.get(event.request);
		if (token !== undefined) {
			return token;
		}
		const cookie = event.cookies.get(AUTH_JWT_COOKIE);
		return cookie && !isTokenExpiring(cookie, 0) ? cookie : null;
	}

	/**
	 * Whether the request carries a live session. Verifies the access token
	 * against the backend (once per request), so a forged cookie can't fake a
	 * session.
	 */
	function isAuthenticated(event: RequestEvent): Promise<boolean> {
		let check = authChecks.get(event.request);
		if (check === undefined) {
			check = checkAuthenticated(getAccessToken(event));
			authChecks.set(event.request, check);
		}
		return check;
	}

	/**
	 * The state the client's `setupConvexAuth` hydrates from. Return it from
	 * the root `+layout.server.ts`.
	 */
	function getAuthState(event: RequestEvent): ConvexAuthServerState {
		return { token: getAccessToken(event) };
	}

	return { handleAuth, getAccessToken, isAuthenticated, getAuthState };
}
