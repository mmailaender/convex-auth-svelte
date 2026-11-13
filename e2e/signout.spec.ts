import { test, expect } from '@playwright/test';
import { signOut, signUp } from './auth';

test('sign-out clears the session', async ({ page, context }) => {
	await signUp(page);
	await signOut(page);

	const cookies = await context.cookies();
	expect(cookies.find((c) => c.name === '__convexAuthRefreshToken')).toBeUndefined();

	// The protected page is no longer reachable.
	await page.goto('/product');
	await page.waitForURL(/\/signin(\?.*)?$/);
});
