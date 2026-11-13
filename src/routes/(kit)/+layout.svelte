<script lang="ts">
	import { setupConvexAuth } from '$lib/sveltekit';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { api } from '$lib/convex/_generated/api';

	let { children, data } = $props();

	// SvelteKit with SSR: the refresh token lives in an httpOnly cookie.
	setupConvexAuth({
		getServerState: () => data.authState,
		convexUrl: PUBLIC_CONVEX_URL,
		api: api.auth,
		verbose: true
	});
</script>

{@render children()}
