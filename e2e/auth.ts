import { expect, type Page } from '@playwright/test';

const PASSWORD = 'correct horse battery staple';

/** A username no other test run has used. */
export function uniqueUsername() {
	return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Create an account through the sign-up page, which also signs it in. */
export async function signUp(page: Page, username = uniqueUsername()) {
	await page.goto('/signup');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign up' }).click();
	await page.waitForURL('/product');
	return username;
}

/** Sign in to an existing account through the sign-in page. */
export async function signIn(page: Page, username: string) {
	await page.goto('/signin');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await page.waitForURL('/product');
}

export async function signOut(page: Page) {
	await page.goto('/product');
	await page.locator('#user-menu-trigger').click();
	await page.getByRole('button', { name: 'Sign out' }).click();
	await page.waitForURL('/');
	await expect(page.getByText('You are not authenticated.')).toBeVisible();
}
