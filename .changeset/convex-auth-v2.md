---
'@mmailaender/convex-auth-svelte': major
---

Support Convex Auth v2 (`@convex-dev/auth@^2.0.0`). Convex Auth v1 is no longer supported; stay on 0.1.x for it.

The API now mirrors upstream's React and Next.js clients:

- `setupConvexAuth` (counterpart of `ConvexAuthProvider`), `useAuthActions()` and `useAuthToken()` from `/svelte`. The auth state comes from `convex-svelte`'s `useAuth()`.
- SvelteKit: the auth routes use upstream's `setupConvexAuthServer`. `setupConvexAuthSvelteKit` from `/sveltekit/server` (counterpart of `setupConvexAuthNextjs`) returns `convexAuthSvelteKitHandle`, `convexAuthSvelteKitAccessToken` and `isAuthenticatedSvelteKit`. `setupConvexAuthSvelteKit` from `/sveltekit` is the counterpart of `ConvexAuthNextjsProvider`. The refresh token lives in an httpOnly cookie.
- Method hooks with upstream's names: `/methods/username-password`, `/methods/email-password`, `/methods/google`, `/methods/github`, `/methods/apple` and `/methods/oauth`.
- Sessions revoked on the server sign the client out reactively.
- Breaking: our `useAuth()`, `useAuth().signIn(provider, params)`, `createConvexAuthHooks`, `createConvexAuthHandlers` and `createRouteMatcher` are removed. Passkeys aren't supported yet.
- Peer dependencies: `@convex-dev/auth@^2.0.0`, `convex@^1.48.0`, `convex-svelte@^0.15.0`. `@auth/core` is no longer needed.
