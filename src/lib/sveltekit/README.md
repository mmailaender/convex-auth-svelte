# Convex Auth for SvelteKit

Use `@mmailaender/convex-auth-svelte/sveltekit` to add [Convex Auth v2](https://github.com/get-convex/convex-auth) to a SvelteKit app with server-side rendering. The refresh token lives in an httpOnly cookie that only your SvelteKit server reads, and pages render signed in on the first request.

Building a client-only app instead? See the [Svelte docs](../svelte/README.md).

## Install

```bash
pnpm add @mmailaender/convex-auth-svelte @convex-dev/auth convex convex-svelte
```

Requires `@convex-dev/auth` 2.x, `convex` 1.48 or later, and `convex-svelte` 0.15 or later.

## Set up the backend

The Convex functions are plain Convex Auth v2, with nothing Svelte-specific. Follow upstream's [getting started guide](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/getting-started.mdx) and the guide of each [sign-in method](https://github.com/get-convex/convex-auth/tree/main/packages/docs/docs/methods). The demo backend in [`src/lib/convex`](../convex) wires up username + password and GitHub:

```ts
// src/convex/auth.ts
import { components, internal } from './_generated/api';
import { setupConvexAuth } from '@convex-dev/auth/server';
import { setupUsernamePassword } from '@convex-dev/auth/methods/username-password/server';

const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;

export const { signUpWithUsernamePassword, signInWithUsernamePassword } = setupUsernamePassword(
	auth,
	{ component: components.authPassword, usernameComponent: components.authUsername }
).attachUserCallbacks({ createUser: internal.users.createUser });
```

The client needs `signOut`, `refreshSession` and `isAuthenticated` exported from the same module, so `api.auth` carries all three.

## Configure the server

Call `createConvexAuthHooks` once, and list every function that signs a user in. The sign-in route refuses any function that isn't in `signIn`.

```ts
// src/lib/server/convexAuth.ts
import { createConvexAuthHooks } from '@mmailaender/convex-auth-svelte/sveltekit/server';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api';

export const { handleAuth, getAuthState, isAuthenticated, getAccessToken } = createConvexAuthHooks({
	convexUrl: PUBLIC_CONVEX_URL,
	api: api.auth,
	signIn: [api.auth.signInWithUsernamePassword, api.auth.signUpWithUsernamePassword]
});
```

Mount `handleAuth` as your `handle` hook, first in the chain if you have others:

```ts
// src/hooks.server.ts
import { handleAuth } from '$lib/server/convexAuth';

export const handle = handleAuth;
```

`handleAuth` does three things:

- It serves `POST /auth/signin`, `POST /auth/refresh` and `POST /auth/signout`. They're plain `Request => Response` handlers from `@convex-dev/auth/ssr`. You don't create route files for them.
- It refreshes the session cookies of every other request when the access token is within 10 seconds of expiry. Access tokens live one minute by default, so this happens often.
- It resolves the request inside `convex-svelte`'s `withServerConvexToken`, so `createConvexHttpClient()` and `convexLoad()` from `convex-svelte/sveltekit` are authenticated as the user.

The auth routes reject POSTs whose `Origin` doesn't match the request's `Host`. If a proxy rewrites `Host`, add your public origin to `allowedOrigins`.

| Option           | Default                                          | Purpose                                                       |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| `cookieOptions`  | `{ secure: !dev }`                               | `secure`, `path` and `domain` of the auth cookies             |
| `routes`         | `/auth/signin`, `/auth/refresh`, `/auth/signout` | Where the auth routes live. Pass the same value to the client |
| `allowedOrigins` | `[]`                                             | Extra origins the auth routes accept POSTs from               |

## Hand the session to the client

Return the auth state from your root layout's server load:

```ts
// src/routes/+layout.server.ts
import { getAuthState } from '$lib/server/convexAuth';

export const load = (event) => ({ authState: getAuthState(event) });
```

Then call `setupConvexAuth` in the root layout, in place of `setupConvex`:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { api } from '$convex/_generated/api';

	let { children, data } = $props();

	setupConvexAuth({
		getServerState: () => data.authState,
		convexUrl: PUBLIC_CONVEX_URL,
		api: api.auth
	});
</script>

{@render children()}
```

The state holds only the access token. When the user signs in or out, the client calls `invalidateAll()` so your load functions run again with the new cookies. Pass `invalidateOnAuthChange: false` to turn that off.

## Sign in

Each sign-in method has its own helpers, mirroring upstream's React hooks. Call them during component initialization and read `pending` from the returned object. Destructuring `pending` loses its reactivity.

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSignInWithUsernamePassword } from '@mmailaender/convex-auth-svelte/methods/username-password';
	import { api } from '$convex/_generated/api';

	const login = useSignInWithUsernamePassword(api.auth);
	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const result = await login.signIn({ username, password });
		if (result.status === 'complete') return goto('/');
		error = result.userError.error; // e.g. INVALID_CREDENTIALS, RATE_LIMITED, OTHER_ERROR
	}
</script>

<form {onsubmit}>
	<input id="username" autocomplete="username" bind:value={username} disabled={login.pending} />
	<input
		id="password"
		type="password"
		autocomplete="current-password"
		bind:value={password}
		disabled={login.pending}
	/>
	{#if error}<p role="alert">{error}</p>{/if}
	<button disabled={login.pending}>Sign in</button>
</form>
```

The helpers resolve to a result and never reject. A thrown error comes back as `OTHER_ERROR`, with the original on `cause`.

| Import path                                                           | Helpers                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@mmailaender/convex-auth-svelte/methods/username-password`           | `useSignInWithUsernamePassword`, `useSignUpWithUsernamePassword`                                                                                                                                             |
| `@mmailaender/convex-auth-svelte/methods/email-password`              | `useSignInWithEmailPassword`, `useSignUpWithEmailPassword`, `useCompleteSignUpWithEmailPassword`, `useStartPasswordRecovery`, `useCompletePasswordRecovery`, `useStartChangeEmail`, `useCompleteChangeEmail` |
| `@mmailaender/convex-auth-svelte/methods/google`, `/github`, `/apple` | `useSignInWith<Provider>`, `useOauth`                                                                                                                                                                        |

The email link helpers (`useComplete*`) run on their own once the session has loaded, and return `{ current }` with a `status` of `loading`, `complete` or `error`.

Passkeys (`usernamePasskey`) aren't supported yet.

### OAuth

`useSignInWithGithub(api.auth).signIn()` navigates to GitHub. GitHub redirects back to the page that started the flow, and the client finishes the sign-in there. Add the provider's `completeSignIn*` function to the server's `signIn` list:

```ts
signIn: [api.auth.completeSignInWithGithub /* , ... */];
```

The origin you redirect back to must be in the backend's `allowedRedirectOrigins`. A failure after the redirect, like the user cancelling at GitHub, shows up in `useOauth().flowError`, on whichever page the flow returned to.

## Read the auth state

```svelte
<script lang="ts">
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';

	const auth = useAuth();
</script>

{#if auth.isLoading}
	<p>Loading…</p>
{:else if auth.isAuthenticated}
	<button onclick={() => auth.signOut()}>Sign out</button>
{/if}
```

`isAuthenticated` turns `true` once the Convex backend accepts the token. `token` is the current access token, for calls to your own HTTP actions.

When a session is revoked on the server (another device signs out all sessions, or a password reset), the client signs out within a moment. It doesn't wait for the access token to expire.

## Protect routes

Check `isAuthenticated(event)` in a hook that runs after `handleAuth`. It verifies the token with the backend once per request, so a forged cookie doesn't pass.

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import { createRouteMatcher } from '@mmailaender/convex-auth-svelte/sveltekit/server';
import { handleAuth, isAuthenticated } from '$lib/server/convexAuth';

const isProtectedRoute = createRouteMatcher(['/product{/*rest}']);

const protectRoutes: Handle = async ({ event, resolve }) => {
	if (isProtectedRoute(event.url.pathname) && !(await isAuthenticated(event))) {
		redirect(307, `/signin?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}
	return resolve(event);
};

export const handle = sequence(handleAuth, protectRoutes);
```

`createRouteMatcher` takes [path-to-regexp](https://github.com/pillarjs/path-to-regexp) patterns, a `RegExp`, or a function of the path.

## Query data on the server

Inside requests that `handleAuth` handled, `convex-svelte`'s client is already authenticated:

```ts
// src/routes/product/+page.server.ts
import { createConvexHttpClient } from 'convex-svelte/sveltekit';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api';

export const load = async () => {
	const client = createConvexHttpClient({ url: PUBLIC_CONVEX_URL });
	return { viewer: await client.query(api.users.viewer, {}) };
};
```

To pass the token yourself, `getAccessToken(event)` returns it, or `null`. It only checks the expiry, which is fine for Convex calls because Convex verifies the token. Use `isAuthenticated(event)` to decide whether a request is signed in.
