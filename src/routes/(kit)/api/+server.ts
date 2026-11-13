import { json } from '@sveltejs/kit';
import { isAuthenticatedSvelteKit } from '$lib/server/convexAuth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const authenticated = await isAuthenticatedSvelteKit(event);
	return json({ someData: authenticated }, { status: authenticated ? 200 : 403 });
};
