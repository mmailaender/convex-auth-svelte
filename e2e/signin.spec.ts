import { test, expect } from '@playwright/test';
import { signIn, signOut, signUp, uniqueUsername } from './auth';

test('sign-in with an unknown username fails', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Get Started' }).click();
	await page.waitForURL('/signin');

	await page.getByLabel('Username').fill(uniqueUsername());
	await page.getByLabel('Password').fill('correct horse battery staple');
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();

	await expect(page.getByRole('alert')).toHaveText('No account exists with that username.');
});

test('sign-up signs in, and the session survives a reload', async ({ page }) => {
	const username = await signUp(page);
	await expect(page.locator('#user-menu-trigger')).toBeVisible();

	// Server-rendered as signed in from the cookies.
	await page.reload();
	await expect(page).toHaveURL('/product');

	await page.locator('#user-menu-trigger').click();
	await expect(page.getByText(username)).toBeVisible();
});

test('sign-in with an existing account', async ({ page }) => {
	const username = await signUp(page);
	await signOut(page);

	await signIn(page, username);
	await expect(page.locator('#user-menu-trigger')).toBeVisible();
});

test('the refresh token stays in an httpOnly cookie', async ({ page, context }) => {
	await signUp(page);

	const cookies = await context.cookies();
	const refresh = cookies.find((c) => c.name === '__convexAuthRefreshToken');
	expect(refresh?.httpOnly).toBe(true);
	const stored = await page.evaluate(() => JSON.stringify(window.localStorage));
	expect(stored).not.toContain(refresh!.value);
});

test('the signed-in user can send a message', async ({ page }) => {
	await signUp(page);
	const body = `hello ${Date.now()}`;
	await page.getByPlaceholder('Write a message…').fill(body);
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText(body)).toBeVisible();
});
