/**
 * Retry policy for the client's auth calls. Mirrors the one `@convex-dev/auth`
 * uses internally (it isn't exported): these calls commonly fail transiently
 * on mobile when the app is backgrounded mid-request, so a network error is
 * worth a couple of retries before giving up.
 *
 * @module
 */

/** Retry after this much time (ms), based on the retry number. */
const RETRY_BACKOFF = [500, 2000];
const RETRY_JITTER = 100;

/**
 * Whether `error` looks like a fetch-level network failure. The message test
 * covers the wording used by Chromium, Firefox, and WebKit.
 */
function isNetworkError(error: unknown): boolean {
	return error instanceof TypeError && /network|failed to fetch|load failed/i.test(error.message);
}

/**
 * Run `fn`, retrying with backoff when it throws a network error. Any other
 * error, or a network error persisting past the last retry, is rethrown.
 */
export async function retryOnNetworkError<T>(fn: () => Promise<T>): Promise<T> {
	for (const backoff of RETRY_BACKOFF) {
		try {
			return await fn();
		} catch (error) {
			if (!isNetworkError(error)) {
				throw error;
			}
			const wait = backoff + RETRY_JITTER * Math.random();
			await new Promise((resolve) => setTimeout(resolve, wait));
		}
	}
	return await fn();
}
