import { test, expect } from './fixtures';
import { signOut, signUp } from './auth';

test('route handler returns 403 when not authenticated', async ({ page }) => {
	const response = await page.goto('/api/');
	expect(response?.status()).toBe(403);
});

test('route handler returns 200 when authenticated', async ({ page }) => {
	await signUp(page);
	const response = await page.goto('/api/');
	expect(response?.status()).toBe(200);
	await signOut(page);
});

test('auth routes refuse cross-site requests', async ({ request }) => {
	const response = await request.post('/auth/refresh', {
		headers: { origin: 'https://evil.example.com' },
		data: {}
	});
	expect(response.status()).toBe(403);
});
