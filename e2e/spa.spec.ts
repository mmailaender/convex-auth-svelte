import { test, expect, type Page } from '@playwright/test';
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

/** Sign up on the SPA page, which signs in. */
async function signUpOnSpa(page: Page, username: string) {
	await page.goto('/spa');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill('correct horse battery staple');
	await page.getByRole('button', { name: 'Sign up' }).click();
	await expect(page.getByText(`Signed in as ${username}`)).toBeVisible();
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

	await expect(first.getByText(`Signed in as ${b}`)).toBeVisible();
	await context.close();
});
