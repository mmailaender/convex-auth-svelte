import { convexAuthSvelteKitAccessToken } from '$server/convexAuth.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (event) => {
	return { convexAuthToken: convexAuthSvelteKitAccessToken(event) };
};
