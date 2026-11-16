import { createConvexHttpClient } from 'convex-svelte/sveltekit';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api.js';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	// The handle hook runs the request with the session's access token, so this
	// client is authenticated as the signed-in user.
	const client = createConvexHttpClient({ url: PUBLIC_CONVEX_URL });
	const [viewer, messages] = await Promise.all([
		client.query(api.users.viewer, {}),
		client.query(api.messages.list, {})
	]);
	return { viewer, messages };
}) satisfies PageServerLoad;
