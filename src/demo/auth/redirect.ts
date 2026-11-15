/**
 * The path to continue to after signing in: `redirectTo` when it is a path on
 * this site, `fallback` otherwise. Never an absolute URL, so a link can't
 * send a user who just signed in to another site.
 */
export function safeRedirect(redirectTo: string | null | undefined, fallback = '/'): string {
	if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
		return fallback;
	}
	if (redirectTo.startsWith('/\\')) {
		return fallback;
	}
	return redirectTo;
}
