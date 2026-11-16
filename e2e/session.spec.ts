import { execFileSync } from 'node:child_process';
import { test, expect } from '@playwright/test';
import { decodeJwt } from 'jose';
import { signUp } from './auth';

// The demo backend keeps the default access-token TTL of one minute.
const ACCESS_TOKEN_TTL_MS = 60_000;

test('the session outlives its access token', async ({ page }) => {
	test.setTimeout(4 * ACCESS_TOKEN_TTL_MS);
	await signUp(page);

	// Leave the app, so no client refreshes the token, and let it expire. The
	// server refreshes it from the cookie before rendering.
	await page.goto('about:blank');
	await page.waitForTimeout(ACCESS_TOKEN_TTL_MS + 5_000);
	await page.goto('/product');
	await expect(page).toHaveURL('/product');
	await expect(page.locator('#user-menu-trigger')).toBeVisible();

	// Stay on the page past the next expiry: the client refreshes through the
	// refresh route, and stays signed in.
	const refreshed = page.waitForResponse(
		(response) => response.url().endsWith('/auth/refresh') && response.status() === 200,
		{ timeout: ACCESS_TOKEN_TTL_MS + 30_000 }
	);
	await refreshed;
	const body = `still here ${Date.now()}`;
	await page.getByPlaceholder('Write a message…').fill(body);
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText(body)).toBeVisible();
});

const hasAdminAccess = !!(process.env.CONVEX_DEPLOYMENT || process.env.CONVEX_SELF_HOSTED_URL);

test('a session revoked on the server signs the browser out', async ({ page }) => {
	test.skip(!hasAdminAccess, 'Needs `npx convex run` access to the deployment.');
	await signUp(page);

	const token = await page.evaluate(() => {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)!;
			if (key.startsWith('__convexAuthJWT_')) return localStorage.getItem(key);
		}
		return null;
	});
	expect(token).not.toBeNull();
	// The `sub` of a v2 access token is the session id.
	const sessionId = decodeJwt(token!).sub!;
	execFileSync(
		'npx',
		[
			'convex',
			'run',
			'--component',
			'auth',
			'public:revokeSessions',
			JSON.stringify({ sessionIds: [sessionId] })
		],
		{ stdio: 'pipe' }
	);

	// The client watches `isAuthenticated`, so it signs out without waiting
	// for the access token to expire.
	await expect
		.poll(() =>
			page.evaluate(() =>
				Object.keys(localStorage).some((key) => key.startsWith('__convexAuthJWT_'))
			)
		)
		.toBe(false);
	await page.goto('/product');
	await page.waitForURL(/\/signin(\?.*)?$/);
});
