# Convex Auth for Svelte and SvelteKit

Svelte bindings for [Convex Auth v2](https://github.com/get-convex/convex-auth) (`@convex-dev/auth@2`).

- [SvelteKit with server-side rendering](src/lib/sveltekit/README.md)
- [Client-only Svelte](src/lib/svelte/README.md)

Version 1.x supports Convex Auth v2 only. Apps on Convex Auth v1 (`@convex-dev/auth@0.0.x`) stay on `@mmailaender/convex-auth-svelte@0.1.x`.

## Upgrade from 0.1.x

Convex Auth v2 is a rewrite. The backend moves to components and per-method setup functions, so start with upstream's [migration notes](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/migrating/from-convex-auth-v1.mdx). v2 has fewer sign-in methods than v1 at launch (no magic links, OTP, anonymous sign-in or arbitrary Auth.js providers), and upstream's migration tooling for existing user data isn't out yet.

On the Svelte side:

- `useAuth().signIn(provider, params)` is gone. Each method has its own helpers, e.g. `useSignInWithUsernamePassword(api.auth)` from `@mmailaender/convex-auth-svelte/methods/username-password`.
- `setupConvexAuth` takes `api: api.auth`, and `convexUrl` is required.
- SvelteKit: `createConvexAuthHooks` takes `api` and a `signIn` allowlist, and its `handleAuth` serves `/auth/signin`, `/auth/refresh` and `/auth/signout`. Delete your `/api/auth` route.
- SvelteKit: `getAuthState(event)` is synchronous and returns `{ token }`. The refresh token no longer reaches page data.
- SvelteKit: `createConvexAuthHandlers` and its `createConvexHttpClient(event)` are gone. Use `createConvexHttpClient` from `convex-svelte/sveltekit`, which `handleAuth` authenticates for you.

## Develop

`pnpm dev` runs the demo app in `src/routes` against the Convex deployment in `.env.local`. `/` is the SvelteKit demo and `/spa` the client-only one. See [e2e/README.md](e2e/README.md) to run the tests.
