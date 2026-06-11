import { test, expect } from '@playwright/test';
import { signInWithSecret, signOut } from './auth';

test('route handler returns 403 when not authenticated', async ({ page }) => {
	const response = await page.goto('/api/');

	expect(response).not.toBeNull();
	expect(response?.status()).toBe(403);
});

test('route handler returns 200 when authenticated', async ({ page }) => {
	await signInWithSecret(page);

	const response = await page.goto('/api/');

	expect(response).not.toBeNull();
	expect(response?.status()).toBe(200);

	await signOut(page);
});
