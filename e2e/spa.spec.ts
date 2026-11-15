import { test, expect } from '@playwright/test';
import { fillUsernameForm, openAccountMenu, uniqueUsername } from './auth';

test('single-page app: sign up, reload, sign out, sign in', async ({ page, context }) => {
	const username = uniqueUsername();
	await page.goto('/spa');
	await page.getByRole('button', { name: 'Create an account' }).click();
	await fillUsernameForm(page, username);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByTestId('spa-name')).toHaveText(username);

	// The SPA keeps the session in localStorage, not in cookies.
	const cookies = await context.cookies();
	expect(cookies.find((c) => c.name.startsWith('__convexAuth'))).toBeUndefined();
	await page.reload();
	await expect(page.getByTestId('spa-name')).toHaveText(username);

	await openAccountMenu(page);
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
	expect(
		await page.evaluate(() =>
			Object.keys(localStorage).some((key) => key.startsWith('__convexAuthRefreshToken_'))
		)
	).toBe(false);

	await fillUsernameForm(page, username);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page.getByTestId('spa-name')).toHaveText(username);
});
