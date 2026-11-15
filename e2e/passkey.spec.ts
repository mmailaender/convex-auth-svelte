import type { CDPSession, Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { openAccount, openAccountMenu, uniqueUsername } from './auth';

// The tests run the passkey ceremonies against Chromium's virtual
// authenticators, driven over the DevTools protocol. Chromium allows one
// `internal` (platform) authenticator per page, so the second passkey lives
// on a `usb` security key.
test.skip(({ browserName }) => browserName !== 'chromium', 'Virtual authenticators need Chromium.');

type Transport = 'internal' | 'usb';

async function enableWebAuthn(page: Page) {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('WebAuthn.enable');
	return cdp;
}

async function addAuthenticator(cdp: CDPSession, transport: Transport = 'internal') {
	const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
		options: {
			protocol: 'ctap2',
			transport,
			hasResidentKey: true,
			hasUserVerification: true,
			isUserVerified: true
		}
	});
	return authenticatorId;
}

async function credentialCount(cdp: CDPSession, authenticatorId: string) {
	const { credentials } = await cdp.send('WebAuthn.getCredentials', { authenticatorId });
	return credentials.length;
}

/** Count the conditional (autofill) requests the page sends to the browser. */
async function countAutofillRequests(page: Page) {
	await page.addInitScript(() => {
		const credentials = navigator.credentials;
		const get = credentials.get.bind(credentials);
		const counter = window as unknown as { __autofillRequests: number };
		counter.__autofillRequests = 0;
		credentials.get = (options) => {
			if (options?.mediation === 'conditional') counter.__autofillRequests += 1;
			return get(options);
		};
	});
}

const autofillRequests = (page: Page) =>
	page.evaluate(() => (window as unknown as { __autofillRequests: number }).__autofillRequests);

const passkeyForm = (page: Page) => page.getByRole('form', { name: 'Sign in with a passkey' });

/** Sign out through the account menu. */
async function signOut(page: Page) {
	await page.goto('/');
	await openAccountMenu(page);
	await page.getByRole('button', { name: 'Sign out' }).click();
	await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
}

/**
 * Sign out, then open the sign-in page while the authenticator ignores the
 * conditional request that the passkey form starts. A virtual authenticator
 * answers passkey autofill as soon as it holds a passkey, which would sign
 * the user straight back in. With presence simulation off, that request
 * stays pending and never resolves, even once presence is back on, so the
 * next modal ceremony is the first to get an answer.
 */
async function openSignInWithAutofillPending(page: Page, cdp: CDPSession, authenticatorId: string) {
	await signOut(page);
	await cdp.send('WebAuthn.setAutomaticPresenceSimulation', { authenticatorId, enabled: false });
	await page.goto('/signin');
	await expect.poll(() => autofillRequests(page)).toBeGreaterThan(0);
	// Give the request time to reach the authenticator before presence is
	// back on.
	await page.waitForTimeout(500);
	await cdp.send('WebAuthn.setAutomaticPresenceSimulation', { authenticatorId, enabled: true });
	// The passkey tab isn't selected, so its form is hidden, but it's mounted
	// and its autofill request runs.
	await expect(page.locator('form[aria-label="Sign in with a passkey"]')).toHaveAttribute(
		'data-autofill',
		'waiting'
	);
}

/** Run the identifier-first flow of the Passkey tab. */
async function continueWithPasskey(page: Page, username: string) {
	await page.getByRole('tab', { name: 'Passkey' }).click();
	await passkeyForm(page).getByRole('textbox', { name: 'Username' }).fill(username);
	await page.getByRole('button', { name: 'Continue with a passkey' }).click();
}

const passkeyList = (page: Page) =>
	page.getByRole('list', { name: 'Passkeys' }).getByRole('listitem');

/** Create an account with a passkey on the authenticator. */
async function signUpWithPasskey(page: Page) {
	const username = uniqueUsername();
	await page.goto('/signin');
	await continueWithPasskey(page, username);
	await expect(page.getByTestId('session-name')).toHaveText(username);
	await openAccount(page);
	await expect(passkeyList(page)).toHaveCount(1);
	return username;
}

test('sign up with a passkey, sign out, and sign in with the username', async ({ page }) => {
	await countAutofillRequests(page);
	const cdp = await enableWebAuthn(page);
	const authenticator = await addAuthenticator(cdp);

	const username = await signUpWithPasskey(page);
	expect(await credentialCount(cdp, authenticator)).toBe(1);

	await openSignInWithAutofillPending(page, cdp, authenticator);
	// Submitting pauses the pending autofill request, so the modal ceremony
	// gets the browser's one ceremony slot.
	await continueWithPasskey(page, username);
	await expect(page.getByTestId('session-name')).toHaveText(username);
	// The sign-in reused the passkey rather than making another.
	expect(await credentialCount(cdp, authenticator)).toBe(1);
});

test('passkey autofill signs in without a username', async ({ page }) => {
	const cdp = await enableWebAuthn(page);
	await addAuthenticator(cdp);
	const username = await signUpWithPasskey(page);
	await signOut(page);

	// The virtual authenticator answers the conditional request of the passkey
	// form right away, as if the user had picked the passkey from the
	// autocompletion list of the username field.
	const autofillSignIn = page.waitForResponse(
		(response) =>
			response.url().includes('/auth/signin') &&
			(response.request().postData() ?? '').includes('finishSignInWithUsernamePasskey')
	);
	await page.goto('/signin');
	expect((await autofillSignIn).status()).toBe(200);
	await expect(page.getByTestId('session-name')).toHaveText(username);
});

test('add a second passkey, rename it, and remove it', async ({ page }) => {
	const cdp = await enableWebAuthn(page);
	await addAuthenticator(cdp);
	await signUpWithPasskey(page);

	// Another passkey must authorize a removal, so the only one can't go.
	await expect(passkeyList(page).getByRole('button', { name: /^Remove/ })).toBeDisabled();

	// The user re-authenticates with the first passkey, then registers the
	// security key.
	const securityKey = await addAuthenticator(cdp, 'usb');
	await page.getByRole('button', { name: 'Add a passkey' }).click();
	await expect(passkeyList(page)).toHaveCount(2);
	expect(await credentialCount(cdp, securityKey)).toBe(1);

	const second = passkeyList(page).nth(1);
	await second.getByRole('button', { name: /^Rename/ }).click();
	await second.getByRole('textbox', { name: 'Passkey name' }).fill('Security key');
	await second.getByRole('button', { name: 'Save' }).click();
	const renamed = passkeyList(page).filter({ hasText: 'Security key' });
	await expect(renamed).toHaveCount(1);

	// The other passkey authorizes the removal.
	await renamed.getByRole('button', { name: 'Remove Security key' }).click();
	await expect(passkeyList(page)).toHaveCount(1);
	await expect(passkeyList(page).filter({ hasText: 'Security key' })).toHaveCount(0);
	await expect(page.getByRole('dialog', { name: 'Account' }).getByRole('alert')).toHaveCount(0);
});
