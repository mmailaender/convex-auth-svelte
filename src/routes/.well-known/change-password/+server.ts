import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Password managers open this URL to change a password; it leads to the
// account dialog. https://w3c.github.io/webappsec-change-password-url/
// Through the sign-in page, which sends a signed-in user straight on and a
// signed-out one there after signing in.
export const GET: RequestHandler = () =>
	redirect(303, `/signin?redirectTo=${encodeURIComponent('/?dialog=profile')}`);
