import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
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
	await callback.waitForSelector('html[data-hydrated]');
	await expect(callback.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

	const other = await context.newPage();
	const username = uniqueUsername();
	await other.goto('/spa');
	await other.waitForSelector('html[data-hydrated]');
	await other.getByRole('button', { name: 'Create an account' }).click();
	await fillUsernameForm(other, username);
	await other.getByRole('button', { name: 'Create account' }).click();
	await expect(other.getByTestId('spa-name')).toHaveText(username);

	await expect(callback.getByTestId('spa-name')).toHaveText(username);
});

/** Sign up on the SPA page, which signs in. */
async function signUpOnSpa(page: Page, username: string) {
	await page.goto('/spa');
	await page.waitForSelector('html[data-hydrated]');
	await page.getByRole('button', { name: 'Create an account' }).click();
	await fillUsernameForm(page, username);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByTestId('spa-name')).toHaveText(username);
}

test('a tab follows another tab that switches to another session', async ({ browser }) => {
	// Session B, from another browser.
	const elsewhere = await browser.newContext();
	const b = uniqueUsername();
	const elsewherePage = await elsewhere.newPage();
	await signUpOnSpa(elsewherePage, b);
	const sessionB = await elsewherePage.evaluate(() =>
		Object.fromEntries(
			Object.keys(localStorage)
				.filter((key) => key.startsWith('__convexAuth'))
				.map((key) => [key, localStorage.getItem(key)!])
		)
	);
	await elsewhere.close();

	// Two tabs signed in as A. The second takes over session B without signing
	// out, so the first stays signed in throughout and has to notice the switch.
	const context = await browser.newContext();
	const first = await context.newPage();
	await signUpOnSpa(first, uniqueUsername());
	const second = await context.newPage();
	await second.goto('/spa');
	await second.evaluate((tokens) => {
		for (const [key, value] of Object.entries(tokens)) localStorage.setItem(key, value);
	}, sessionB);

	await expect(first.getByTestId('spa-name')).toHaveText(b);
	await context.close();
});
