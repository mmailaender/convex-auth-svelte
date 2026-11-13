<script lang="ts">
	import { setupConvexAuth } from '$lib/svelte/index.svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { api } from '$lib/convex/_generated/api';

	let { children } = $props();

	// A single-page app: the browser holds both tokens in localStorage.
	setupConvexAuth({ convexUrl: PUBLIC_CONVEX_URL, api: api.auth });
</script>

{@render children()}
