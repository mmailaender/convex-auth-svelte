import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Password managers open this URL to change a password; it leads to the
// account dialog. https://w3c.github.io/webappsec-change-password-url/
export const GET: RequestHandler = () => redirect(303, '/?dialog=profile');
