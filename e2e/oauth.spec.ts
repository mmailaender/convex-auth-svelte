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

for (const provider of ['Google', 'Apple']) {
	test(`the ${provider} button starts its flow`, async ({ page }) => {
		const host = provider === 'Google' ? 'accounts.google.com' : 'appleid.apple.com';
		await page.route(`https://${host}/**`, (route) =>
			route.fulfill({ contentType: 'text/html', body: `<p>${provider}</p>` })
		);
		await page.goto('/signin');
		await page.getByRole('button', { name: `Continue with ${provider}` }).click();
		await page.waitForURL((url) => url.host === host);
		expect(new URL(page.url()).searchParams.get('state')).toBeTruthy();
	});
}

test('an error in the OAuth callback shows up as flowError', async ({ page }) => {
	await page.goto('/signin?convexAuthError=access_denied');
	await expect(page.getByRole('alert')).toHaveText('The sign-in was cancelled.');
	// The client strips its params from the URL.
	await expect(page).toHaveURL('/signin');
});

test('a callback code this browser never asked for is refused', async ({ page }) => {
	await page.goto('/signin?convexAuthCode=not-a-real-code');
	await expect(page.getByRole('alert')).toHaveText("The sign-in couldn't be completed. Try again.");
	await expect(page).toHaveURL('/signin');
});
