import { redirect } from '@sveltejs/kit';
import { convexAuthSvelteKitHandle } from '$server/convexAuth.server';
import { safeRedirect } from '$demo/auth/redirect.js';

const isAuthPage = (path: string) => path === '/signin' || path === '/signup';
const isProtectedRoute = (path: string) => path === '/product' || path.startsWith('/product/');

// Refreshes the session up front, so load functions see a current token, and
// redirects based on whether the request is signed in.
export const handle = convexAuthSvelteKitHandle(async (event, { isAuthenticated }) => {
	const path = event.url.pathname;
	if (isAuthPage(path) && (await isAuthenticated())) {
		redirect(307, safeRedirect(event.url.searchParams.get('redirectTo')));
	}
	if (isProtectedRoute(path) && !(await isAuthenticated())) {
		redirect(307, `/signin?redirectTo=${encodeURIComponent(path + event.url.search)}`);
	}
});
