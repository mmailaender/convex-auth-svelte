import { getAuthState } from '$lib/server/convexAuth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = (event) => {
	return { authState: getAuthState(event) };
};
