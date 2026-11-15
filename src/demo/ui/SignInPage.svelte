<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useAuth } from 'convex-svelte';
	import { safeRedirect } from '$demo/auth/redirect.js';
	import AuthPage from './AuthPage.svelte';
	import SignIn from '$demo/auth/ui/SignIn.svelte';

	let { mode = 'signIn' }: { mode?: 'signIn' | 'signUp' } = $props();

	const auth = useAuth();
	const next = $derived(safeRedirect(page.url.searchParams.get('redirectTo')));

	// Covers every method, including an OAuth flow that finished on this page.
	$effect(() => {
		if (auth.isAuthenticated) void goto(next, { replaceState: true });
	});
</script>

<AuthPage>
	<SignIn {mode} />
</AuthPage>
