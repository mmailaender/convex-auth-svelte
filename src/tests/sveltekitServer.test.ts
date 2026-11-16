import { describe, expect, it, vi } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { AUTH_JWT_COOKIE, AUTH_REFRESH_COOKIE } from '@convex-dev/auth/ssr';
import { setupConvexAuthSvelteKit } from '$lib/sveltekit/server/index.js';

/** An unsigned JWT that expires `inSeconds` from now. */
function jwt(inSeconds: number) {
	const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
	const exp = Math.floor(Date.now() / 1000) + inSeconds;
	return `${part({ alg: 'none' })}.${part({ sub: 'session', exp })}.sig`;
}

const rotated = { accessToken: jwt(3600), refreshToken: 'refresh-2' };

// The refresh mutation rotates the session.
vi.mock('convex/browser', () => ({
	ConvexHttpClient: class {
		mutation = async () => ({
			kind: 'rotated',
			tokens: { ...rotated, refreshTokenExpiresAt: Date.now() + 86_400_000 }
		});
	}
}));

function fakeCookies(initial: Record<string, string>): Cookies {
	const jar = new Map(Object.entries(initial));
	return {
		get: (name: string) => jar.get(name),
		getAll: () => [...jar].map(([name, value]) => ({ name, value })),
		set: (name: string, value: string) => void jar.set(name, value),
		delete: (name: string) => void jar.delete(name),
		serialize: (name: string, value: string) => `${name}=${value}`
	} as Cookies;
}

describe('convexAuthSvelteKitHandle', () => {
	const { convexAuthSvelteKitHandle } = setupConvexAuthSvelteKit({
		convexUrl: 'https://example.convex.cloud',
		refreshSession: 'auth:refreshSession' as never,
		isAuthenticated: 'auth:isAuthenticated' as never
	});

	/** A request whose access token is about to expire, so the hook refreshes it. */
	function expiringRequest() {
		return {
			url: new URL('https://app.example/api/admin'),
			request: new Request('https://app.example/api/admin'),
			cookies: fakeCookies({ [AUTH_JWT_COOKIE]: jwt(5), [AUTH_REFRESH_COOKIE]: 'refresh-1' })
		} as unknown as RequestEvent;
	}

	const rotatedCookies = [
		`${AUTH_JWT_COOKIE}=${rotated.accessToken}`,
		`${AUTH_REFRESH_COOKIE}=${rotated.refreshToken}`
	];

	it('adds the rotated cookies to a Response a later hook returns without resolving', async () => {
		const handle = convexAuthSvelteKitHandle();
		const response = await handle({
			event: expiringRequest(),
			resolve: () => new Response('Forbidden', { status: 403 })
		});
		expect(response.status).toBe(403);
		expect(response.headers.getSetCookie()).toEqual(rotatedCookies);
	});

	it("doesn't repeat cookies SvelteKit already added", async () => {
		const handle = convexAuthSvelteKitHandle();
		const response = await handle({
			event: expiringRequest(),
			resolve: () => {
				const page = new Response('page');
				for (const cookie of rotatedCookies) page.headers.append('set-cookie', cookie);
				return page;
			}
		});
		expect(response.headers.getSetCookie()).toEqual(rotatedCookies);
	});

	it('adds the rotated cookies to a Response the handler returns', async () => {
		const event = expiringRequest();
		const handle = convexAuthSvelteKitHandle(
			() => new Response('Forbidden', { status: 403, headers: { 'x-kept': 'yes' } })
		);

		const response = await handle({ event, resolve: () => new Response('page') });

		expect(response.status).toBe(403);
		expect(response.headers.get('x-kept')).toBe('yes');
		expect(response.headers.getSetCookie()).toEqual(rotatedCookies);
	});
});
