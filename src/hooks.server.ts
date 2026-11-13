import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import { createRouteMatcher } from '$lib/sveltekit/server';
import { handleAuth, isAuthenticated } from '$lib/server/convexAuth';

const isAuthPage = createRouteMatcher(['/signin', '/signup']);
const isProtectedRoute = createRouteMatcher(['/product{/*rest}']);

const protectRoutes: Handle = async ({ event, resolve }) => {
	if (isAuthPage(event.url.pathname) && (await isAuthenticated(event))) {
		redirect(307, '/product');
	}
	if (isProtectedRoute(event.url.pathname) && !(await isAuthenticated(event))) {
		redirect(
			307,
			`/signin?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`
		);
	}
	return resolve(event);
};

export const handle = sequence(handleAuth, protectRoutes);
