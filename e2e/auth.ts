import type { Page } from '@playwright/test';

function getE2ETestSecret() {
	const secret = process.env.AUTH_E2E_TEST_SECRET;
	if (!secret) {
		throw new Error(
			'AUTH_E2E_TEST_SECRET must be set for authenticated e2e tests. In GitHub Actions, add it as a repository secret or variable matching the Convex AUTH_E2E_TEST_SECRET value.'
		);
	}
	return secret;
}

export async function signInWithSecret(page: Page) {
	await page.goto('/signin');
	await page.getByLabel('Secret').fill(getE2ETestSecret());
	await page.getByRole('button').getByText('Sign in with secret').click();
	await page.waitForURL('/product');
}

export async function signOut(page: Page) {
	await page.goto('/product');
	await page.locator('#user-menu-trigger').click();
	await page.getByRole('button').getByText('Sign out').click();
}
