import { auth } from '$server/serverAuth.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request }) => auth.signOutHandler(request);
