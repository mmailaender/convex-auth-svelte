<!--
	The client-only variant: `ssr = false`, and `setupConvexAuth` instead of the
	SvelteKit bindings. The components are the same.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { useAuth, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { METHOD_LABELS } from '$demo/auth/config.js';
	import SignIn from '$demo/auth/ui/SignIn.svelte';
	import AuthPage from '$demo/ui/AuthPage.svelte';
	import { setProfileDialog } from '$demo/users/ui/profileDialog.js';

	const auth = useAuth();
	const viewer = useQuery(api.users.viewer, () => (auth.isAuthenticated ? {} : 'skip'));
</script>

{#if auth.isLoading}
	<div class="flex flex-1 items-center justify-center">
		<div class="placeholder h-40 w-full max-w-md animate-pulse"></div>
	</div>
{:else if auth.isAuthenticated}
	<AuthPage>
		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-1.5">
				<h1 class="h4">Single-page app</h1>
				<p class="text-surface-700-300 text-sm">
					Signed in as <strong data-testid="spa-name">{viewer.data?.name ?? '…'}</strong>
					{#if viewer.data}with {METHOD_LABELS[viewer.data.method] ?? viewer.data.method}{/if}. This
					session lives in localStorage, apart from the SvelteKit pages.
				</p>
			</div>
			<button class="btn preset-tonal" onclick={() => setProfileDialog(page.url, true)}>
				Open your account
			</button>
		</div>
	</AuthPage>
{:else}
	<AuthPage>
		<!-- Emailed links open the SvelteKit pages, whose session is separate, so
		     email + password is left out here. -->
		<SignIn
			methods={{
				usernamePassword: true,
				usernamePasskey: true,
				github: true,
				google: true,
				apple: true
			}}
		/>
	</AuthPage>
{/if}
