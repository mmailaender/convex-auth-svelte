import { test, expect } from './fixtures';
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

test('a tab opened from an OAuth callback follows sign-ins in other tabs', async ({ context }) => {
	// The callback code puts the client in a pending sign-in while it starts.
	// It's refused, and the tab must still hear about sessions of other tabs.
	const callback = await context.newPage();
	await callback.goto('/spa?convexAuthCode=not-a-real-code');
	await expect(callback.getByRole('button', { name: 'Sign in' })).toBeVisible();

	const other = await context.newPage();
	const username = uniqueUsername();
	await other.goto('/spa');
	await other.getByLabel('Username').fill(username);
	await other.getByLabel('Password').fill('correct horse battery staple');
	await other.getByRole('button', { name: 'Sign up' }).click();
	await expect(other.getByText(`Signed in as ${username}`)).toBeVisible();

	await expect(callback.getByText(`Signed in as ${username}`)).toBeVisible();
});
