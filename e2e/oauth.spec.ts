import { test, expect } from '@playwright/test';

test('starting a GitHub sign-in redirects to GitHub', async ({ page }) => {
	await page.route('https://github.com/**', (route) =>
		route.fulfill({ contentType: 'text/html', body: '<p>GitHub</p>' })
	);
	await page.goto('/signin');
	await page.getByRole('button', { name: 'Continue with GitHub' }).click();
	await page.waitForURL(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
	const url = new URL(page.url());
	expect(url.searchParams.get('state')).toBeTruthy();
});

test('an error in the OAuth callback shows up as flowError', async ({ page }) => {
	await page.goto('/signin?convexAuthError=access_denied');
	await expect(page.getByRole('alert')).toHaveText('Sign-in was cancelled.');
	// The client strips its params from the URL.
	await expect(page).toHaveURL('/signin');
});

test('a callback code this browser never asked for is refused', async ({ page }) => {
	await page.goto('/signin?convexAuthCode=not-a-real-code');
	await expect(page.getByRole('alert')).toHaveText(
		"This sign-in can't be completed here. Please try again."
	);
	await expect(page).toHaveURL('/signin');
});
