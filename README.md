# Convex Auth for Svelte and SvelteKit

Svelte bindings for [Convex Auth v2](https://github.com/get-convex/convex-auth) (`@convex-dev/auth@2`).

- [SvelteKit with server-side rendering](src/lib/sveltekit/README.md)
- [Client-only Svelte](src/lib/svelte/README.md)

Version 1.x supports Convex Auth v2 only. Apps on Convex Auth v1 (`@convex-dev/auth@0.0.x`) stay on `@mmailaender/convex-auth-svelte@0.1.x`.

## Upgrade from 0.1.x

Convex Auth v2 is a rewrite. The backend moves to components and per-method setup functions, so start with upstream's [migration notes](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/migrating/from-convex-auth-v1.mdx). v2 has fewer sign-in methods than v1 at launch (no magic links, OTP, anonymous sign-in or arbitrary Auth.js providers), and upstream's migration tooling for existing user data isn't out yet.

On the Svelte side, the API now mirrors upstream's React and Next.js clients:

- `setupConvexAuth({ convexUrl, api: api.auth })` replaces `<ConvexAuthProvider>`. `useAuthActions()` and `useAuthToken()` work as in React, and the auth state comes from `useAuth()` of `convex-svelte`. Our own `useAuth()` is gone.
- `useAuth().signIn(provider, params)` is gone. Each method has the hooks of upstream's React client, e.g. `useSignInWithUsernamePassword(api.auth)` from `@mmailaender/convex-auth-svelte/methods/username-password`.
- SvelteKit: the auth routes come from upstream's `setupConvexAuthServer`, mounted as `/auth/signin`, `/auth/refresh` and `/auth/signout`. Delete your `/api/auth` route.
- SvelteKit: `createConvexAuthHooks` and `createConvexAuthHandlers` are replaced by `setupConvexAuthSvelteKit` from `/sveltekit/server`, the counterpart of `setupConvexAuthNextjs`. The client's `setupConvexAuth` from `/sveltekit` is now `setupConvexAuthSvelteKit` and takes `initialToken` instead of `getServerState`. The refresh token no longer reaches page data.
- `createRouteMatcher` is gone, as in upstream v2. Compare `event.url.pathname` in your handler.

See [docs/upstreaming.md](docs/upstreaming.md) for how this maps onto `@convex-dev/auth` and what a PR there could share.

## Develop

`pnpm dev` runs the demo app in `src/routes` against the Convex deployment in `.env.local`. `/` is the SvelteKit demo and `/spa` the client-only one. See [e2e/README.md](e2e/README.md) to run the tests.
