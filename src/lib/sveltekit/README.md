# Convex Auth for SvelteKit

Use `@mmailaender/convex-auth-svelte/sveltekit` to add [Convex Auth v2](https://github.com/get-convex/convex-auth) to a SvelteKit app with server-side rendering. The refresh token lives in an httpOnly cookie that only your SvelteKit server reads, and pages render signed in on the first request.

The setup follows upstream's [Next.js SSR guide](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/ssr-nextjs/setup.mdx) step by step. The auth routes use upstream's `setupConvexAuthServer` unchanged. Where Next.js has a proxy, a server provider and a client provider, SvelteKit has a `handle` hook, a layout load and a setup function.

Building a client-only app instead? See the [Svelte docs](../svelte/README.md).

## Install

```bash
pnpm add @mmailaender/convex-auth-svelte@alpha @convex-dev/auth convex convex-svelte
```

The v2 bindings are in prerelease under the `alpha` tag. Without it, you'd get 0.1.x, which runs on Convex Auth v1.

Requires `@convex-dev/auth` 2.x, `convex` 1.48 or later, and `convex-svelte` 0.15 or later.

## Set up the backend

The Convex functions are plain Convex Auth v2, with nothing Svelte-specific. Follow upstream's [getting started guide](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/getting-started.mdx) and the guide of each [sign-in method](https://github.com/get-convex/convex-auth/tree/main/packages/docs/docs/methods). The demo backend in [`src/lib/convex`](../convex) wires up every method: email + password, username + password, username + passkey, GitHub, Google and Apple.

Export `signOut`, `refreshSession` and `isAuthenticated` from `convex/auth.ts`:

```ts
const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;
```

## Set up the auth route handlers

Call upstream's `setupConvexAuthServer`. List every function that creates a session in `signIn`: the sign-in route refuses any function that isn't listed.

```ts
// src/lib/server/serverAuth.ts
import { dev } from '$app/environment';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { setupConvexAuthServer } from '@convex-dev/auth/ssr';
import { api } from '$convex/_generated/api';

export const auth = setupConvexAuthServer({
	convexUrl: PUBLIC_CONVEX_URL,
	refreshSession: api.auth.refreshSession,
	signOut: api.auth.signOut,
	signIn: [api.auth.signInWithUsernamePassword, api.auth.signUpWithUsernamePassword],
	cookieOptions: { secure: !dev }
});
```

## Mount the auth routes

The client posts to `/auth/signin`, `/auth/refresh` and `/auth/signout`, so mount one handler at each path:

```ts
// src/routes/auth/signin/+server.ts
import { auth } from '$lib/server/serverAuth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) => auth.convexProxyHandler(request);
```

Do the same with `auth.refreshHandler` in `src/routes/auth/refresh/+server.ts` and `auth.signOutHandler` in `src/routes/auth/signout/+server.ts`. To mount them elsewhere, pass the paths to `setupConvexAuthSvelteKit` on both the server (`authRoutes`) and the client (`signInRoute`, `refreshRoute`, `signOutRoute`).

The routes reject POSTs whose `Origin` doesn't match the request's `Host`. If a proxy rewrites `Host`, add your public origin to `allowedOrigins` of `setupConvexAuthServer`.

## Set up the SvelteKit helpers

`setupConvexAuthSvelteKit` from `/sveltekit/server` is the counterpart of `setupConvexAuthNextjs`:

```ts
// src/lib/server/convexAuth.ts
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { setupConvexAuthSvelteKit } from '@mmailaender/convex-auth-svelte/sveltekit/server';
import { api } from '$convex/_generated/api';

export const {
	convexAuthSvelteKitHandle,
	convexAuthSvelteKitAccessToken,
	isAuthenticatedSvelteKit
} = setupConvexAuthSvelteKit({
	convexUrl: PUBLIC_CONVEX_URL,
	refreshSession: api.auth.refreshSession,
	isAuthenticated: api.auth.isAuthenticated
});
```

| Next.js                       | SvelteKit                               |
| ----------------------------- | --------------------------------------- |
| `convexAuthNextjsProxy`       | `convexAuthSvelteKitHandle`             |
| `nextjsProxyRedirect`         | SvelteKit's `redirect()`                |
| `convexAuthNextjsAccessToken` | `convexAuthSvelteKitAccessToken(event)` |
| `isAuthenticatedNextjs`       | `isAuthenticatedSvelteKit(event)`       |

`cookieOptions` takes the same values as in `setupConvexAuthServer`; `secure` defaults to `true` outside of `vite dev`.

## Set up the handle hook

The hook runs before each request. It refreshes the session when the access token is within 10 seconds of expiry, so your load functions see a current token. Access tokens live one minute by default, so this happens often. It skips the auth routes, which set their own cookies.

Pass a handler to redirect based on whether the request is signed in. Throw `redirect()` or return a `Response` to leave, or return nothing to render the page:

```ts
// src/hooks.server.ts
import { redirect } from '@sveltejs/kit';
import { convexAuthSvelteKitHandle } from '$lib/server/convexAuth';

export const handle = convexAuthSvelteKitHandle(async (event, { isAuthenticated }) => {
	if (event.url.pathname.startsWith('/product') && !(await isAuthenticated())) {
		redirect(307, `/signin?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}
});
```

`isAuthenticated()` verifies the token with the backend, so a forged cookie doesn't pass. To combine it with other hooks, use `sequence(convexAuthSvelteKitHandle(), yourHandle)`. Don't throw `error()` in the handler or in a later hook: SvelteKit leaves the cookies off error responses, so a session the hook just refreshed would be lost. Return a `Response` with the error status instead.

The hook also resolves the request inside `convex-svelte`'s `withServerConvexToken`. Load functions then get an authenticated client from `createConvexHttpClient()` of `convex-svelte/sveltekit`:

```ts
// src/routes/product/+page.server.ts
import { createConvexHttpClient } from 'convex-svelte/sveltekit';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const client = createConvexHttpClient({ url: PUBLIC_CONVEX_URL });
	return { viewer: await client.query(api.users.viewer, {}) };
};
```

## Set up the client

Return the access token from your root layout's server load:

```ts
// src/routes/+layout.server.ts
import { convexAuthSvelteKitAccessToken } from '$lib/server/convexAuth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (event) => ({
	convexAuthToken: convexAuthSvelteKitAccessToken(event)
});
```

Then call `setupConvexAuthSvelteKit` from `/sveltekit` in the root layout, in place of `setupConvex`. It's the counterpart of `ConvexAuthNextjsProvider`:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { setupConvexAuthSvelteKit } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { api } from '$convex/_generated/api';

	let { children, data } = $props();

	setupConvexAuthSvelteKit({
		convexUrl: PUBLIC_CONVEX_URL,
		initialToken: () => data.convexAuthToken,
		api: api.auth
	});
</script>

{@render children()}
```

`initialToken` is a getter so the `data` prop isn't captured at its initial value. It's read once. When the user signs in, signs out or switches to another session, the client calls `invalidateAll()` so your load functions run again with the new cookies. Pass `invalidateOnAuthChange: false` to turn that off.

## Sign in

Each sign-in method has the hooks of upstream's React client, under the same names. Call them during component initialization and read `pending` from the returned object, because destructuring `pending` loses its reactivity.

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

| Upstream (`@convex-dev/auth/...`)         | Svelte (`@mmailaender/convex-auth-svelte/...`) |
| ----------------------------------------- | ---------------------------------------------- |
| `methods/username-password/react`         | `methods/username-password`                    |
| `methods/username-passkey/react`          | `methods/username-passkey`                     |
| `methods/email-password/react`            | `methods/email-password`                       |
| `methods/google/react`, `github`, `apple` | `methods/google`, `github`, `apple`            |
| `methods/oauth/react`                     | `methods/oauth`                                |

The email link hooks (`useCompleteSignUpWithEmailPassword`, `useCompletePasswordRecovery`, `useCompleteChangeEmail`) return `{ current }` instead of the state itself, so the state stays reactive.

For email + password, add `signInWithEmailPassword`, `completeSignUpWithEmailPassword` and `completePasswordRecovery` to the `signIn` list of `setupConvexAuthServer`: they create sessions. `signUpWithEmailPassword` and the functions that start a flow or change the email address run on the Convex client and aren't listed.

### Passkeys

`useSignInWithUsernamePasskey(api.auth)` runs the identifier-first flow of upstream's `usernamePasskey` method: a free username creates an account with a new passkey, and a taken one asks for that account's passkey. Add `finishSignUpWithUsernamePasskey` and `finishSignInWithUsernamePasskey` to the `signIn` list of `setupConvexAuthServer`. The other passkey functions run on the Convex client and aren't listed.

```svelte
<script lang="ts">
	import { useSignInWithUsernamePasskey } from '@mmailaender/convex-auth-svelte/methods/username-passkey';
	import { api } from '$convex/_generated/api';

	const login = useSignInWithUsernamePasskey(api.auth);
	let username = $state('');
	let error = $state<string | null>(null);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		const result = await login.signIn({ username });
		// ALREADY_PENDING means an earlier attempt still has its dialog open.
		if (result.status === 'error' && result.userError.error !== 'ALREADY_PENDING') {
			error = result.userError.error; // e.g. CEREMONY_ABORTED, USERNAME_TOO_SHORT
		}
	}
</script>

<form {onsubmit}>
	<input autocomplete="username webauthn" required bind:value={username} disabled={login.pending} />
	{#if error}<p role="alert">{error}</p>{/if}
	<button disabled={login.pending}>Continue with a passkey</button>
</form>
```

While the component is mounted, the browser also offers the stored passkeys in the autocompletion list of the username field, and picking one signs in. The field needs `autocomplete="username webauthn"` for that. The autofill request starts when the component mounts and is aborted when it's destroyed. The browser runs one at a time, so call `useSignInWithUsernamePasskey` once per page. Its failures show up in `login.autofill.lastError`, not in the result of `signIn`.

For the settings page, `useAddPasskey(api.auth).addPasskey()` and `useRemovePasskey(api.auth).removePasskey(passkeyId)` run the passkey dialogs. Adding asks the user to confirm with a passkey they already have. Removing asks for a different passkey of the account, so the last one can't be removed (`LAST_PASSKEY`). Listing and renaming have no helper, as in upstream: call `useQuery(api.auth.listPasskeys, {})` and `useConvexClient().mutation(api.auth.renamePasskey, { passkeyId, name })` from `convex-svelte`.

The backend's `origin` must list every origin the app is served from, including the port, and `rpId` must be their domain. The demo derives both from `SITE_URL`, adding `http://localhost:5173` (`vite dev`) and `http://localhost:4173` (`vite preview`) when it's on `localhost`. Its [`PasskeyForm`](../../demo/auth/ui/PasskeyForm.svelte) and [`Passkeys`](../../demo/users/ui/Passkeys.svelte) components show the whole flow.

### OAuth

`useSignInWithGithub(api.auth).signIn()` navigates to GitHub. GitHub redirects back to the page that started the flow, and the client finishes the sign-in there. Add the provider's `completeSignIn*` function to the `signIn` list of `setupConvexAuthServer`. The `startSignIn*` function runs on the Convex client and isn't listed.

To come back somewhere else, pass an absolute URL: `signIn({ redirectTo: new URL('/welcome', location.origin).href })`. Its origin must be in the backend's `allowedRedirectOrigins`. The client redeems the code on the page the flow returns to, so return to a page that doesn't require sign-in. A failure after the redirect, like the user cancelling at GitHub, shows up in `useOauth().flowError` on whichever page the flow returned to.

## Read the auth state

As with React, the state comes from the Convex bindings and the actions from Convex Auth:

| React                                 | Svelte                                                           |
| ------------------------------------- | ---------------------------------------------------------------- |
| `useConvexAuth()` from `convex/react` | `useAuth()` from `convex-svelte`                                 |
| `useAuthActions()`                    | `useAuthActions()` from `@mmailaender/convex-auth-svelte/svelte` |
| `useAuthToken()`                      | `useAuthToken()`, read as `.current`                             |

```svelte
<script lang="ts">
	import { useAuth } from 'convex-svelte';
	import { useAuthActions } from '@mmailaender/convex-auth-svelte/svelte';

	const auth = useAuth();
	const { signOut } = useAuthActions();
</script>

{#if auth.isLoading}
	<p>Loading…</p>
{:else if auth.isAuthenticated}
	<button onclick={() => signOut()}>Sign out</button>
{/if}
```

When a session is revoked on the server (for example by a password reset), the client signs out as soon as its `isAuthenticated` query updates. It doesn't wait for the access token to expire.

## Migrate from 0.1.x

0.1.x ran on Convex Auth v1. Move the backend first, with upstream's [migration guide](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/migrating/from-convex-auth-v1.mdx): v2 replaces `convexAuth({ providers })` and `auth.addHttpRoutes(http)` with components and one setup function per sign-in method. Then change the SvelteKit app as below. `@auth/core` is no longer a dependency.

### 1. Server setup and the handle hook

`createConvexAuthHooks()` and `createConvexAuthHandlers()` become one `setupConvexAuthSvelteKit()`, set up in [Set up the SvelteKit helpers](#set-up-the-sveltekit-helpers). Its handle hook takes your redirect logic as a handler. `createRouteMatcher` is gone, as in upstream v2:

```diff
 // src/hooks.server.ts
-import { sequence } from '@sveltejs/kit/hooks';
-import {
-	createConvexAuthHooks,
-	createRouteMatcher
-} from '@mmailaender/convex-auth-svelte/sveltekit/server';
-
-const isProtectedRoute = createRouteMatcher(['/product{/*rest}']);
-const { handleAuth, isAuthenticated } = createConvexAuthHooks();
-
-const protect: Handle = async ({ event, resolve }) => {
-	if (isProtectedRoute(event.url.pathname) && !(await isAuthenticated(event))) {
-		redirect(307, '/signin');
-	}
-	return resolve(event);
-};
-
-export const handle = sequence(handleAuth, protect);
+import { convexAuthSvelteKitHandle } from '$lib/server/convexAuth';
+
+export const handle = convexAuthSvelteKitHandle(async (event, { isAuthenticated }) => {
+	if (event.url.pathname.startsWith('/product') && !(await isAuthenticated())) {
+		redirect(307, '/signin');
+	}
+});
```

### 2. The auth routes

`handleAuth` answered `POST /api/auth` from inside the hook. v2's client posts to `/auth/signin`, `/auth/refresh` and `/auth/signout` instead, served by upstream's handlers. Add them as in [Set up the auth route handlers](#set-up-the-auth-route-handlers) and [Mount the auth routes](#mount-the-auth-routes), and list every sign-in function in `signIn`.

### 3. The root layout

The server passes down the access token instead of a serialized auth state, and the refresh token no longer reaches page data:

```diff
 // src/routes/+layout.server.ts
-import { createConvexAuthHandlers } from '@mmailaender/convex-auth-svelte/sveltekit/server';
-
-const { getAuthState } = createConvexAuthHandlers();
-
-export const load = async (event) => ({ authState: await getAuthState(event) });
+import { convexAuthSvelteKitAccessToken } from '$lib/server/convexAuth';
+import type { LayoutServerLoad } from './$types';
+
+export const load: LayoutServerLoad = (event) => ({
+	convexAuthToken: convexAuthSvelteKitAccessToken(event)
+});
```

```diff
 <!-- src/routes/+layout.svelte -->
 <script lang="ts">
-	import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
+	import { setupConvexAuthSvelteKit } from '@mmailaender/convex-auth-svelte/sveltekit';
+	import { PUBLIC_CONVEX_URL } from '$env/static/public';
+	import { api } from '$convex/_generated/api';

 	let { children, data } = $props();

-	setupConvexAuth({ getServerState: () => data.authState });
+	setupConvexAuthSvelteKit({
+		convexUrl: PUBLIC_CONVEX_URL,
+		initialToken: () => data.convexAuthToken,
+		api: api.auth
+	});
 </script>
```

`convexUrl` is no longer read from the environment for you, and `options` is renamed to `clientOptions`.

### 4. Load functions and endpoints

The handle hook runs each request with the session's token, so `convex-svelte`'s client is authenticated as is:

```diff
 // src/routes/product/+page.server.ts
-import { createConvexAuthHandlers } from '@mmailaender/convex-auth-svelte/sveltekit/server';
+import { createConvexHttpClient } from 'convex-svelte/sveltekit';
+import { PUBLIC_CONVEX_URL } from '$env/static/public';

 export const load: PageServerLoad = async (event) => {
-	const { createConvexHttpClient } = createConvexAuthHandlers();
-	const client = await createConvexHttpClient(event);
+	const client = createConvexHttpClient({ url: PUBLIC_CONVEX_URL });
 	return { viewer: await client.query(api.users.viewer, {}) };
 };
```

Replace `createConvexAuthHandlers().isAuthenticated(event)` with `isAuthenticatedSvelteKit(event)`.

### 5. Signing in

The generic `signIn(provider, params)` is gone. Each method has its own helpers, and a failure comes back as a typed result instead of a thrown error (see [Sign in](#sign-in)):

| 0.1.x                                                  | 1.x                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signIn('password', { email, password, flow })`        | `useSignInWithEmailPassword(api.auth)`, `useSignUpWithEmailPassword(api.auth)` from `/methods/email-password`. Sign-up finishes on the emailed link's page with `useCompleteSignUpWithEmailPassword(api.auth, { emailCode })`                                                                     |
| `signIn('password', …)` with usernames                 | `useSignInWithUsernamePassword(api.auth)`, `useSignUpWithUsernamePassword(api.auth)` from `/methods/username-password`                                                                                                                                                                            |
| `signIn('password', { flow: 'reset', … })`             | `useStartPasswordRecovery(api.auth)`, then `useCompletePasswordRecovery(api.auth, { emailCode })` on the emailed link's page                                                                                                                                                                      |
| `signIn('github', { redirectTo: '/welcome' })`         | `useSignInWithGithub(api.auth).signIn({ redirectTo: new URL('/welcome', location.origin).href })`, and `google`, `apple` likewise. `redirectTo` must now be an absolute URL on an origin in the backend's `allowedRedirectOrigins`, and a page that doesn't require sign-in (see [OAuth](#oauth)) |
| magic links, OTP, `anonymous`, other Auth.js providers | not in Convex Auth v2 yet                                                                                                                                                                                                                                                                         |

Add each method's session-creating functions to the `signIn` list of `setupConvexAuthServer`, or the sign-in route refuses them.

### 6. Auth state and sign-out

```diff
 <script lang="ts">
-	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
+	import { useAuth } from 'convex-svelte';
+	import { useAuthActions, useAuthToken } from '@mmailaender/convex-auth-svelte/svelte';

-	const { isLoading, isAuthenticated, signOut, token } = useAuth();
+	const auth = useAuth(); // auth.isLoading, auth.isAuthenticated
+	const { signOut } = useAuthActions();
+	const token = useAuthToken(); // token.current
 </script>
```
