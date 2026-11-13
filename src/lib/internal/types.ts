/**
 * Types shared by the Svelte and SvelteKit bindings.
 *
 * `@convex-dev/auth/browser` exports the `AuthClient` and its config, but not
 * every type the config refers to (the ambient sign-in contract and the
 * sign-in API live in internal modules). They are derived from the exported
 * config here, so they always match the installed `@convex-dev/auth`.
 *
 * @module
 */
import type { AuthClientConfig } from '@convex-dev/auth/browser';

export type {
	AuthClient,
	AuthClientConfig,
	AuthState,
	TokenStorage
} from '@convex-dev/auth/browser';
export type {
	ConvexAuthApi,
	IsAuthenticatedFn,
	RefreshSessionFn,
	SignOutFn,
	SlimTokenBundle,
	TokenBundle,
	ExposedSignInFn,
	AuthCookieOptions
} from '@convex-dev/auth/ssr';

type AmbientSignInsConfig = NonNullable<AuthClientConfig['ambientSignIns']>;

/**
 * A sign-in method that runs on its own at client startup, like finishing an
 * OAuth flow when the identity provider redirects back to the app.
 *
 * Pass these to `setupConvexAuth`'s `ambientSignIns` option. The default is
 * `[oauth()]`.
 */
export type AmbientSignInClient = AmbientSignInsConfig['signIns'][number];

/** What an ambient sign-in's setup receives. */
export type AmbientSignInContext = Parameters<AmbientSignInClient['setup']>[0];

/**
 * How the sign-in functions of a method get executed: against the deployment
 * in a SPA, or through the SvelteKit auth proxy under SSR, which moves the
 * refresh token into an httpOnly cookie.
 */
export type AuthSignInApi = AmbientSignInsConfig['signInApi'];

/** How the mutations that mint no session get executed. */
export type ConvexMutationApi = AmbientSignInsConfig['convex'];
