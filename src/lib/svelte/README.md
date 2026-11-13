# Convex Auth for Svelte

Use `@mmailaender/convex-auth-svelte/svelte` to add [Convex Auth v2](https://github.com/get-convex/convex-auth) to a client-only Svelte app. The browser holds the session: the access and refresh tokens live in `localStorage`, or in the storage you pass.

With SvelteKit and server-side rendering, use the [SvelteKit bindings](../sveltekit/README.md) instead. They keep the refresh token in an httpOnly cookie.

## Install

```bash
pnpm add @mmailaender/convex-auth-svelte @convex-dev/auth convex convex-svelte
```

Requires `@convex-dev/auth` 2.x, `convex` 1.48 or later, and `convex-svelte` 0.15 or later.

Set up the backend with upstream's [getting started guide](https://github.com/get-convex/convex-auth/blob/main/packages/docs/docs/getting-started.mdx). Export `signOut`, `refreshSession` and `isAuthenticated` from `convex/auth.ts`, so `api.auth` carries all three.

## Set up the client

Call `setupConvexAuth` in your root component, in place of `setupConvex`:

```svelte
<!-- App.svelte -->
<script lang="ts">
	import { setupConvexAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { api } from '../convex/_generated/api';

	let { children } = $props();

	setupConvexAuth({
		convexUrl: import.meta.env.VITE_CONVEX_URL,
		api: api.auth
	});
</script>

{@render children()}
```

| Option             | Default                               | Purpose                                                          |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------- |
| `client`           | created with `setupConvex(convexUrl)` | An existing `ConvexClient`                                       |
| `storage`          | `localStorage`, or memory without one | Where tokens are kept. `sessionStorage` gives each tab a session |
| `storageNamespace` | `convexUrl`                           | Clients sharing a namespace share a session                      |
| `ambientSignIns`   | `[oauth()]`                           | Sign-ins that run at startup. Include `oauth()` if you set it    |

## Sign in and read the state

The sign-in helpers and `useAuth` work as in the [SvelteKit docs](../sveltekit/README.md#sign-in). Import `useAuth` from `@mmailaender/convex-auth-svelte/svelte`:

```svelte
<script lang="ts">
	import { useAuth } from '@mmailaender/convex-auth-svelte/svelte';
	import { useSignInWithUsernamePassword } from '@mmailaender/convex-auth-svelte/methods/username-password';
	import { api } from '../convex/_generated/api';

	const auth = useAuth();
	const login = useSignInWithUsernamePassword(api.auth);
</script>

{#if auth.isAuthenticated}
	<button onclick={() => auth.signOut()}>Sign out</button>
{:else}
	<button
		disabled={login.pending}
		onclick={() => login.signIn({ username: 'ada', password: 'correct horse battery staple' })}
	>
		Sign in
	</button>
{/if}
```

In a SPA, sign-in functions run on the Convex client directly, so there's no allowlist to maintain.
