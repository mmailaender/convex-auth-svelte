// Any origin works here: it only tells a path on this site apart from a URL
// that leaves it.
const BASE = 'http://this.site';

/**
 * The path to continue to after signing in: `redirectTo` when it is a path on
 * this site, `fallback` otherwise. Never an absolute URL, so a link can't
 * send a user who just signed in to another site.
 *
 * The value is resolved the way a browser resolves a `Location` header, so
 * tricks like `//evil.com`, `/\evil.com`, `/<tab>/evil.com` (browsers drop
 * tabs and newlines from URLs) or `/.//evil.com` don't get through.
 */
export function safeRedirect(redirectTo: string | null | undefined, fallback = '/'): string {
	if (!redirectTo || !redirectTo.startsWith('/')) {
		return fallback;
	}
	let url: URL;
	try {
		url = new URL(redirectTo, BASE);
	} catch {
		return fallback;
	}
	// Resolving drops dot segments, so `/.//evil.com` has the path
	// `//evil.com`, which a browser reads as another host.
	if (url.origin !== BASE || url.pathname.startsWith('//')) {
		return fallback;
	}
	return url.pathname + url.search + url.hash;
}
