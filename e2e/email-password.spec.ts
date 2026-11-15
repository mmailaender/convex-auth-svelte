import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { PASSWORD, emailedLink, fillEmailForm, openAccount, signOut, uniqueEmail } from './auth';

/** Sign up with email + password and open the validation link. */
async function signUpWithEmail(page: Page, email = uniqueEmail()) {
	await page.goto('/signup');
	await fillEmailForm(page, email);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByRole('heading', { name: 'Validate your email' })).toBeVisible();

	await page.goto(await emailedLink(page, email));
	await expect(page.getByRole('heading', { name: 'Your email is validated' })).toBeVisible();
	return email;
}

test('sign-up validates the email address, then signs in', async ({ page }) => {
	const email = await signUpWithEmail(page);
	await page.getByRole('link', { name: 'Continue' }).click();
	await expect(page.getByTestId('session-name')).toHaveText(email.split('@')[0]);
});

test('an unvalidated address cannot sign in', async ({ page }) => {
	const email = uniqueEmail();
	await page.goto('/signup');
	await fillEmailForm(page, email);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByTestId('check-inbox')).toBeVisible();

	await page.goto('/signin');
	await fillEmailForm(page, email);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page.getByRole('alert')).toContainText("isn't validated yet");
});

test('a validation link only works in the browser that signed up', async ({ page, browser }) => {
	const email = uniqueEmail();
	await page.goto('/signup');
	await fillEmailForm(page, email);
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page.getByTestId('check-inbox')).toBeVisible();
	const link = await emailedLink(page, email);

	const other = await browser.newPage();
	await other.goto(link);
	await expect(
		other.getByRole('heading', { name: 'Open this link in the browser you signed up from' })
	).toBeVisible();
	await other.close();
});

test('sign-in, and a password reset through the emailed link', async ({ page }) => {
	const email = await signUpWithEmail(page);
	await signOut(page);

	await page.goto('/signin');
	await fillEmailForm(page, email);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await page.waitForURL('/');
	await signOut(page);

	await page.goto('/signin');
	await page.getByRole('button', { name: 'Forgot password?' }).click();
	await page.getByRole('textbox', { name: 'Email' }).fill(email);
	await page.getByRole('button', { name: 'Send reset link' }).click();
	await expect(page.getByTestId('check-inbox')).toBeVisible();

	await page.goto(await emailedLink(page, email, /Reset your password/i));
	const newPassword = `${PASSWORD} again`;
	await page.getByLabel('New password').fill(newPassword);
	await page.getByRole('button', { name: 'Save password' }).click();
	await expect(page.getByRole('heading', { name: 'Your password is changed' })).toBeVisible();

	await signOut(page);
	await page.goto('/signin');
	await fillEmailForm(page, email, newPassword);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await page.waitForURL('/');
});

test('change the email address from the account dialog', async ({ page }) => {
	await signUpWithEmail(page);
	const newEmail = uniqueEmail();

	await openAccount(page);
	const dialog = page.getByRole('dialog', { name: 'Account' });
	await dialog.getByRole('button', { name: 'Change', exact: true }).first().click();
	await dialog.getByRole('textbox', { name: 'New email address' }).fill(newEmail);
	await dialog.locator('#change-email-password').fill(PASSWORD);
	await dialog.getByRole('button', { name: 'Send confirmation link' }).click();
	await expect(dialog.getByRole('heading', { name: 'Confirm your new address' })).toBeVisible();

	await page.goto(await emailedLink(page, newEmail));
	await expect(page.getByRole('heading', { name: 'Your email address is changed' })).toBeVisible();

	await openAccount(page);
	await expect(page.getByTestId('profile-email')).toHaveText(newEmail);
});
