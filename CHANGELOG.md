# Changelog

## 1.0.0-alpha.0

### Major Changes

- 9c7cd80: Support Convex Auth v2 (`@convex-dev/auth@^2.0.0`). Convex Auth v1 is no longer supported; stay on 0.1.x for it.

  The API now mirrors upstream's React and Next.js clients:

  - `setupConvexAuth` (counterpart of `ConvexAuthProvider`), `useAuthActions()` and `useAuthToken()` from `/svelte`. The auth state comes from `convex-svelte`'s `useAuth()`.
  - SvelteKit: the auth routes use upstream's `setupConvexAuthServer`. `setupConvexAuthSvelteKit` from `/sveltekit/server` (counterpart of `setupConvexAuthNextjs`) returns `convexAuthSvelteKitHandle`, `convexAuthSvelteKitAccessToken` and `isAuthenticatedSvelteKit`. `setupConvexAuthSvelteKit` from `/sveltekit` is the counterpart of `ConvexAuthNextjsProvider`. The refresh token lives in an httpOnly cookie.
  - Method hooks with upstream's names: `/methods/username-password`, `/methods/email-password`, `/methods/username-passkey` (sign-in with passkey autofill, and adding and removing passkeys), `/methods/google`, `/methods/github`, `/methods/apple` and `/methods/oauth`.
  - Sessions revoked on the server sign the client out reactively.
  - Breaking: our `useAuth()`, `useAuth().signIn(provider, params)`, `createConvexAuthHooks`, `createConvexAuthHandlers` and `createRouteMatcher` are removed.
  - Peer dependencies: `@convex-dev/auth@^2.0.0`, `convex@^1.48.0`, `convex-svelte@^0.15.0`. `@auth/core` is no longer needed.

## 0.1.4

### Patch Changes

- afe8e22: Chore: Upgrade dependencies to pull in security fixes, most importantly `path-to-regexp@^8.4.2`, which includes fixes for ReDoS/DoS advisories affecting `8.0.0` through `<8.4.0` (CVE-2026-4923 and CVE-2026-4926). Also refreshes `cookie` and `is-network-error` to their latest patched ranges.

## 0.0.2

- Updated README

## 0.0.1

- Initial release
