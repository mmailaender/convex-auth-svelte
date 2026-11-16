<script lang="ts">
	import { useAuth } from 'convex-svelte';
	import { useAuthActions } from '$lib/svelte/index.svelte';

	const auth = useAuth();
	const { signOut } = useAuthActions();
</script>

<div class="flex min-h-[50vh] flex-col items-center justify-center gap-4">
	{#if auth.isLoading}
		<p>Loading…</p>
	{:else if auth.isAuthenticated}
		<p>You are authenticated!</p>
		<a href="/product" class="btn preset-filled-primary-500">Product</a>
		<button onclick={() => signOut()} class="btn preset-tonal">Sign Out</button>
	{:else}
		<p>You are not authenticated.</p>
		<a href="/signin" class="btn preset-filled-primary-500">Get Started</a>
	{/if}
</div>
