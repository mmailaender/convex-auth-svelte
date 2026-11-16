import { test, expect } from './fixtures';
import {
	PASSWORD,
	fillUsernameForm,
	openAccountMenu,
	signIn,
	signOut,
	signUp,
	uniqueUsername
} from './auth';

test('sign-in with an unknown username fails', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Sign in' }).first().click();
	await page.waitForURL(/\/signin/);

	await fillUsernameForm(page, uniqueUsername());
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();

	await expect(page.getByRole('alert')).toHaveText('No account uses this username.');
});

test('sign-up signs in, and the session survives a reload', async ({ page }) => {
	const username = await signUp(page);
	await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible();

	// Server-rendered as signed in from the cookies.
	await page.reload();
	await expect(page).toHaveURL('/product');

	await openAccountMenu(page);
	await expect(page.getByRole('dialog').getByText(username).first()).toBeVisible();
});

test('sign-in with an existing account', async ({ page }) => {
	const username = await signUp(page);
	await signOut(page);

	await signIn(page, username);
	await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible();
});

test('sign-in with a wrong password fails', async ({ page }) => {
	const username = await signUp(page);
	await signOut(page);

	await page.goto('/signin');
	await fillUsernameForm(page, username, `${PASSWORD}!`);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page.getByRole('alert')).toHaveText('Incorrect username or password.');
});

test('the refresh token stays in an httpOnly cookie', async ({ page, context }) => {
	await signUp(page);

	const cookies = await context.cookies();
	const refresh = cookies.find((c) => c.name === '__convexAuthRefreshToken');
	expect(refresh?.httpOnly).toBe(true);
	const stored = await page.evaluate(() => JSON.stringify(window.localStorage));
	expect(stored).not.toContain(refresh!.value);
});

test('a signed-in page settles instead of refreshing in a loop', async ({ page }) => {
	await signUp(page);
	let refreshes = 0;
	page.on('request', (request) => {
		if (new URL(request.url()).pathname === '/auth/refresh') refreshes++;
	});
	await page.reload();
	await page.waitForTimeout(3_000);
	expect(refreshes).toBeLessThanOrEqual(2);
});

test('the signed-in user can send a message', async ({ page }) => {
	await signUp(page);
	const body = `hello ${Date.now()}`;
	await page.getByPlaceholder('Write a message…').fill(body);
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText(body)).toBeVisible();
});
