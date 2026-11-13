---
'@mmailaender/convex-auth-svelte': major
---

Support Convex Auth v2 (`@convex-dev/auth@^2.0.0`). Convex Auth v1 is no longer supported; stay on 0.1.x for it.

- Built on the framework-agnostic `AuthClient` of `@convex-dev/auth/browser` and the SSR handlers of `@convex-dev/auth/ssr`, wired into `convex-svelte`'s `setupAuth`.
- SvelteKit: the refresh token lives in an httpOnly cookie. `createConvexAuthHooks({ convexUrl, api, signIn })` returns a `handleAuth` hook that serves `/auth/signin`, `/auth/refresh` and `/auth/signout`, refreshes cookies up front, and authenticates `convex-svelte`'s `createConvexHttpClient()` for the request.
- New method helpers mirroring upstream's React hooks: `/methods/username-password`, `/methods/email-password`, `/methods/google`, `/methods/github`, `/methods/apple` and `/methods/oauth`.
- Sessions revoked on the server sign the client out reactively.
- Breaking: `useAuth().signIn(provider, params)` is replaced by the method helpers, `setupConvexAuth` requires `convexUrl` and `api`, `getAuthState(event)` returns `{ token }` only, and `createConvexAuthHandlers` is removed. Passkeys aren't supported yet.
- Peer dependencies: `@convex-dev/auth@^2.0.0`, `convex@^1.48.0`, `convex-svelte@^0.15.0`. `@auth/core` is no longer needed.
