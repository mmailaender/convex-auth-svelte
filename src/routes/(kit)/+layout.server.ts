import { convexAuthSvelteKitAccessToken } from '$lib/server/convexAuth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (event) => {
	return { convexAuthToken: convexAuthSvelteKitAccessToken(event) };
};
