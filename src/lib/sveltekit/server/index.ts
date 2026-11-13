/**
 * Server bindings for Convex Auth v2 on SvelteKit: the counterpart of
 * `setupConvexAuthNextjs` from `@convex-dev/auth/ssr/nextjs`.
 *
 * The auth routes come from upstream unchanged: call `setupConvexAuthServer`
 * from `@convex-dev/auth/ssr` and mount its three handlers as `+server.ts`
 * routes. This module adds the SvelteKit-specific parts: the `handle` hook
 * that refreshes the session up front (the counterpart of the Next.js proxy),
 * reading the access token, and checking whether a request is signed in.
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
	type AuthCookieOptions,
	type CookieStore
} from '@convex-dev/auth/ssr';
import type { IsAuthenticatedFn, RefreshSessionFn } from '../../internal/types.js';

/** Configuration of {@link setupConvexAuthSvelteKit}. */
export interface ConvexAuthSvelteKitConfig {
	/** The Convex deployment URL used server-side. */
	convexUrl: string;
	/** The app's `refreshSession` mutation. The hook uses it for its up-front refresh. */
	refreshSession: RefreshSessionFn;
	/**
	 * The app's `isAuthenticated` query. The server verifies the access token
	 * against the backend with it, rather than trusting the cookie.
	 */
	isAuthenticated: IsAuthenticatedFn;
	/**
	 * Overrides the default auth cookie attributes. Use the same values as in
	 * `setupConvexAuthServer`. Unlike there, `secure` may be omitted here; it
	 * defaults to `true` outside of `vite dev`.
	 */
	cookieOptions?: Partial<AuthCookieOptions>;
	/**
	 * The paths of the auth routes, which the hook leaves alone because they
	 * set their own cookies. Defaults to `/auth/signin`, `/auth/refresh` and
	 * `/auth/signout`.
	 */
	authRoutes?: string[];
}

/** Context handed to a {@link ConvexAuthSvelteKitHandler}. */
export interface ConvexAuthSvelteKitHandleCtx {
	/** Whether the request carries a live session, verified with the backend. */
	isAuthenticated: () => Promise<boolean>;
	/** The (possibly just refreshed) access token, or `null`. */
	getToken: () => Promise<string | null>;
}

/**
 * Inspect the request in the hook. Throw SvelteKit's `redirect()` (or return
 * a `Response`) to short-circuit; return nothing to render the page.
 */
export type ConvexAuthSvelteKitHandler = (
	event: RequestEvent,
	ctx: ConvexAuthSvelteKitHandleCtx
) => Promise<Response | undefined | void> | Response | undefined | void;

/** A {@link CookieStore} over SvelteKit's `event.cookies`. */
function svelteKitCookieStore(cookies: Cookies): CookieStore {
	return {
		// A cookie deleted earlier in this request reads back as "".
		get: (name) => cookies.get(name) || undefined,
		set: (name, value, options) =>
			cookies.set(name, value, { ...options, path: options?.path ?? '/' }),
		delete: (name, options) => cookies.delete(name, { ...options, path: options?.path ?? '/' })
	};
}

/**
 * Build the SvelteKit server helpers from one config.
 *
 * ```ts
 * // src/lib/server/auth.ts
 * export const {
 *   convexAuthSvelteKitHandle,
 *   convexAuthSvelteKitAccessToken,
 *   isAuthenticatedSvelteKit
 * } = setupConvexAuthSvelteKit({
 *   convexUrl: PUBLIC_CONVEX_URL,
 *   refreshSession: api.auth.refreshSession,
 *   isAuthenticated: api.auth.isAuthenticated
 * });
 * ```
 */
export function setupConvexAuthSvelteKit(config: ConvexAuthSvelteKitConfig) {
	const httpClient = new ConvexHttpClient(config.convexUrl);
	const cookieOptions: AuthCookieOptions = {
		...config.cookieOptions,
		secure: config.cookieOptions?.secure ?? !dev
	};
	const authRoutes = new Set(
		config.authRoutes ?? ['/auth/signin', '/auth/refresh', '/auth/signout']
	);
	const checkAuthenticated = createServerAuthChecker({
		convexUrl: config.convexUrl,
		isAuthenticated: config.isAuthenticated
	});

	// Memoized per request, keyed by the `Request` that the hook and the load
	// functions of one request share.
	const authChecks = new WeakMap<Request, Promise<boolean>>();

	/**
	 * Build the `handle` hook: the counterpart of `convexAuthNextjsProxy`. It
	 * refreshes the session when the access token is close to expiry (rotating
	 * the cookies), runs your optional `handler`, and resolves the request with
	 * the token set for `convex-svelte`'s `createConvexHttpClient()` and
	 * `convexLoad()`.
	 *
	 * ```ts
	 * // src/hooks.server.ts
	 * export const handle = convexAuthSvelteKitHandle(async (event, { isAuthenticated }) => {
	 *   if (event.url.pathname.startsWith('/product') && !(await isAuthenticated())) {
	 *     redirect(307, '/signin');
	 *   }
	 * });
	 * ```
	 */
	function convexAuthSvelteKitHandle(handler?: ConvexAuthSvelteKitHandler): Handle {
		return async ({ event, resolve }) => {
			// The auth routes set their own cookies from the request's, so a
			// refresh here would rotate the refresh token under them.
			if (authRoutes.has(event.url.pathname)) {
				return resolve(event);
			}
			const session = new ServerAuthSession({
				refreshSession: (refreshToken) =>
					httpClient.mutation(config.refreshSession, { refreshToken }),
				cookies: svelteKitCookieStore(event.cookies),
				cookieOptions
			});
			const token = await session.getToken();
			if (handler !== undefined) {
				const response = await handler(event, {
					isAuthenticated: () => isAuthenticatedSvelteKit(event),
					getToken: () => session.getToken()
				});
				if (response) return response;
			}
			return withServerConvexToken(token ?? undefined, () => resolve(event));
		};
	}

	/**
	 * The access token of the request, or `null`: the counterpart of
	 * `convexAuthNextjsAccessToken`. Never triggers a refresh (the hook does
	 * that) and returns `null` for an expired token. Return it from your root
	 * `+layout.server.ts` for the `initialToken` of `setupConvexAuthSvelteKit`.
	 *
	 * Only the expiry is checked, not the signature. That's safe for
	 * authenticating calls to Convex, which verifies the token. To decide
	 * whether the request is signed in, use {@link isAuthenticatedSvelteKit}.
	 */
	function convexAuthSvelteKitAccessToken(event: RequestEvent): string | null {
		const token = event.cookies.get(AUTH_JWT_COOKIE);
		return token && !isTokenExpiring(token, 0) ? token : null;
	}

	/**
	 * Whether the request carries a live session: the counterpart of
	 * `isAuthenticatedNextjs`. Verifies the access token against the backend
	 * (once per request), so a forged cookie can't fake a session.
	 */
	function isAuthenticatedSvelteKit(event: RequestEvent): Promise<boolean> {
		let check = authChecks.get(event.request);
		if (check === undefined) {
			check = checkAuthenticated(convexAuthSvelteKitAccessToken(event));
			authChecks.set(event.request, check);
		}
		return check;
	}

	return { convexAuthSvelteKitHandle, convexAuthSvelteKitAccessToken, isAuthenticatedSvelteKit };
}
