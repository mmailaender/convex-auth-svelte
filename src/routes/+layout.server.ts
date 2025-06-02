import { createConvexAuthHandlers } from '$lib/sveltekit/server';
import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/public';

// Create auth handlers - explicitly pass the convexUrl from environment variables
const { getAuthState } = createConvexAuthHandlers({
  convexUrl: env.PUBLIC_CONVEX_URL
});

// Export load function to provide auth state to layout
export const load: LayoutServerLoad = async (event) => {
  return { authState: await getAuthState(event) };
};