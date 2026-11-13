import { json } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/convexAuth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const authenticated = await isAuthenticated(event);
	return json({ someData: authenticated }, { status: authenticated ? 200 : 403 });
};
