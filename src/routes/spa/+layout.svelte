<script lang="ts">
	import { setupConvexAuth } from '$lib/svelte/index.svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { api } from '$convex/_generated/api';
	import AppShell from '$demo/ui/AppShell.svelte';

	let { children } = $props();

	// A single-page app: the browser holds both tokens in localStorage.
	setupConvexAuth({ convexUrl: PUBLIC_CONVEX_URL, api: api.auth });
</script>

<AppShell mode="spa" signInHref="/spa">
	{@render children()}
</AppShell>
