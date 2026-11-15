import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'correct horse battery staple';

/** A username no other test run has used. */
export function uniqueUsername() {
	return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** An email address no other test run has used. */
export function uniqueEmail() {
	return `${uniqueUsername()}@example.com`;
}

/** The username + password form of the sign-in card. */
export async function fillUsernameForm(page: Page, username: string, password = PASSWORD) {
	const tab = page.getByRole('tab', { name: 'Username' });
	if ((await tab.isVisible()) && (await tab.getAttribute('aria-selected')) !== 'true') {
		await tab.click();
	}
	await page.getByRole('textbox', { name: 'Username' }).fill(username);
	await page.locator('#username-password').fill(password);
}

/** The email + password form of the sign-in card. */
export async function fillEmailForm(page: Page, email: string, password = PASSWORD) {
	await page.getByRole('textbox', { name: 'Email' }).fill(email);
	await page.locator('#email-password').fill(password);
}

/** Create a username account through the sign-up page, which also signs it in. */
export async function signUp(page: Page, username = uniqueUsername(), redirectTo = '/product') {
	await page.goto(`/signup?redirectTo=${encodeURIComponent(redirectTo)}`);
	await fillUsernameForm(page, username);
	await page.getByRole('button', { name: 'Create account' }).click();
	await page.waitForURL(redirectTo);
	return username;
}

/** Sign in to an existing username account through the sign-in page. */
export async function signIn(page: Page, username: string, password = PASSWORD) {
	await page.goto('/signin?redirectTo=/product');
	await fillUsernameForm(page, username, password);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await page.waitForURL('/product');
}

/** Open the account menu of the signed-in user. */
export async function openAccountMenu(page: Page) {
	await page.getByRole('button', { name: 'Open account menu' }).click();
}

/** Open the account dialog of the signed-in user. */
export async function openAccount(page: Page) {
	await page.goto('/?dialog=profile');
	await expect(page.getByRole('dialog', { name: 'Account' })).toBeVisible();
}

export async function signOut(page: Page) {
	await page.goto('/product');
	await openAccountMenu(page);
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
}

/**
 * The link in the newest email to `email`, from the dev inbox. The inbox
 * rewrites the links to this origin.
 */
export async function emailedLink(page: Page, email: string, subject?: RegExp) {
	await page.goto(`/dev/inbox?to=${encodeURIComponent(email)}`);
	let emails = page.getByTestId('email');
	if (subject) emails = emails.filter({ hasText: subject });
	const link = emails.first().getByRole('link');
	await expect(link).toBeVisible();
	return (await link.getAttribute('href'))!;
}
