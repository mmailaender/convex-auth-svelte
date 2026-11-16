# Convex Auth for Svelte and SvelteKit

Svelte bindings for [Convex Auth v2](https://github.com/get-convex/convex-auth) (`@convex-dev/auth@2`).

- [SvelteKit with server-side rendering](src/lib/sveltekit/README.md)
- [Client-only Svelte](src/lib/svelte/README.md)

Version 1.x supports Convex Auth v2 only. Apps on Convex Auth v1 (`@convex-dev/auth@0.0.x`) stay on `@mmailaender/convex-auth-svelte@0.1.x`.

## Upgrade from 0.1.x

Convex Auth v2 is a rewrite. The backend moves to components and per-method setup functions, so start with upstream's [migration notes](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/migrating/from-convex-auth-v1.mdx). v2 has fewer sign-in methods than v1 at launch (no magic links, OTP, anonymous sign-in or arbitrary Auth.js providers), and upstream's migration tooling for existing user data isn't out yet.

On the Svelte side, the API now mirrors upstream's React and Next.js clients. The migration sections of the [SvelteKit](src/lib/sveltekit/README.md#migrate-from-01x) and [Svelte](src/lib/svelte/README.md#migrate-from-01x) guides show each change as a before/after:

- `useAuth()` from this package is gone: the state comes from `useAuth()` of `convex-svelte`, and the actions from `useAuthActions()`.
- `signIn(provider, params)` is gone: each method has the helpers of upstream's React client, e.g. `useSignInWithUsernamePassword(api.auth)`.
- SvelteKit: `createConvexAuthHooks` and `createConvexAuthHandlers` become `setupConvexAuthSvelteKit`, and sign-in goes through three auth routes from upstream instead of `POST /api/auth`. The refresh token no longer reaches page data.

See [docs/upstreaming.md](docs/upstreaming.md) for how this maps onto `@convex-dev/auth` and what a PR there could share.

## Develop

`pnpm dev` runs the demo app in `src/routes` against the Convex deployment in `.env.local`. `/` is the SvelteKit demo and `/spa` the client-only one. See [e2e/README.md](e2e/README.md) to run the tests.
