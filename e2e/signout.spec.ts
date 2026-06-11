import { test } from '@playwright/test';
import { signInWithSecret } from './auth';

test('signout works', async ({ page }) => {
	await signInWithSecret(page);

	await page.locator('#user-menu-trigger').click();
	await page.getByRole('button').getByText('Sign out').click();
});
