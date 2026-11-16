<!--
	A bare test page for the username + passkey method: the login form when
	signed out, the passkey settings when signed in. The e2e tests in
	e2e/passkey.spec.ts drive it through its labels and roles.
-->
<script lang="ts">
	import { useAuth, useQuery } from 'convex-svelte';
	import { useAuthActions } from '$lib/svelte/index.svelte';
	import { api } from '$convex/_generated/api';
	import PasskeySignIn from './PasskeySignIn.svelte';
	import PasskeySettings from './PasskeySettings.svelte';

	const auth = useAuth();
	const { signOut } = useAuthActions();
	const viewer = useQuery(api.users.viewer, {});
</script>

<main>
	<h1>Passkeys</h1>
	{#if auth.isLoading}
		<p>Loading…</p>
	{:else if auth.isAuthenticated}
		<p>Signed in as {viewer.data?.name ?? '…'}</p>
		<button type="button" onclick={() => signOut()}>Sign out</button>
		<PasskeySettings />
	{:else}
		<PasskeySignIn />
	{/if}
</main>
