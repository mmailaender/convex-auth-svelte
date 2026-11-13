import { test, expect } from '@playwright/test';
import { uniqueUsername } from './auth';

test('single-page app: sign up, reload, sign out, sign in', async ({ page, context }) => {
	const username = uniqueUsername();
	await page.goto('/spa');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill('correct horse battery staple');
	await page.getByRole('button', { name: 'Sign up' }).click();
	await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();

	// The SPA keeps the session in localStorage, not in cookies.
	const cookies = await context.cookies();
	expect(cookies.find((c) => c.name.startsWith('__convexAuth'))).toBeUndefined();
	await page.reload();
	await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();

	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
	expect(
		await page.evaluate(() =>
			Object.keys(localStorage).some((key) => key.startsWith('__convexAuthRefreshToken_'))
		)
	).toBe(false);

	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill('correct horse battery staple');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();
});
