<script lang="ts">
	import { setupConvexAuthSvelteKit } from '$lib/sveltekit';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { api } from '$convex/_generated/api';

	let { children, data } = $props();

	// SvelteKit with SSR: the refresh token lives in an httpOnly cookie.
	setupConvexAuthSvelteKit({
		convexUrl: PUBLIC_CONVEX_URL,
		initialToken: () => data.convexAuthToken,
		api: api.auth
	});
</script>

{@render children()}
