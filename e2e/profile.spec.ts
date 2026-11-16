import { test, expect } from './fixtures';
import { PASSWORD, fillUsernameForm, openAccount, signIn, signOut, signUp } from './auth';

test('rename the account', async ({ page }) => {
	await signUp(page);
	await openAccount(page);

	await page.getByRole('button', { name: 'Edit name' }).click();
	await page.getByRole('textbox', { name: 'Name' }).fill('Ada Lovelace');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByTestId('profile-name')).toHaveText('Ada Lovelace');
	await expect(page.getByTestId('session-name')).toHaveText('Ada Lovelace');
});

test('change the password, signing out other sessions', async ({ page, browser }) => {
	const username = await signUp(page);
	const other = await browser.newPage();
	await signIn(other, username);

	await openAccount(page);
	const dialog = page.getByRole('dialog', { name: 'Account' });
	await dialog.getByRole('button', { name: 'Change', exact: true }).click();
	await dialog.locator('#current-password').fill(`${PASSWORD}!`);
	const newPassword = `${PASSWORD} again`;
	await dialog.locator('#new-password').fill(newPassword);
	await dialog.getByRole('button', { name: 'Change password' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('Your current password is incorrect.');

	await dialog.locator('#current-password').fill(PASSWORD);
	await dialog.getByRole('button', { name: 'Change password' }).click();
	await expect(page.getByText('Password changed')).toBeVisible();

	// The other browser's session was revoked.
	await other.goto('/product');
	await other.waitForURL(/\/signin/);
	await other.close();

	await signOut(page);
	await signIn(page, username, newPassword);
});

test('upload an avatar', async ({ page }) => {
	await signUp(page);
	await openAccount(page);

	// A 64x64 PNG, drawn in the page.
	const png = await page.evaluate(async () => {
		const canvas = new OffscreenCanvas(64, 64);
		const context = canvas.getContext('2d')!;
		context.fillStyle = '#e11d48';
		context.fillRect(0, 0, 64, 64);
		const blob = await canvas.convertToBlob({ type: 'image/png' });
		return Array.from(new Uint8Array(await blob.arrayBuffer()));
	});
	await page
		.getByRole('dialog', { name: 'Account' })
		.locator('input[type=file]')
		.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from(png) });
	await page.getByRole('button', { name: 'Upload' }).click();
	await expect(page.getByText('Avatar updated')).toBeVisible();
	// The header, behind the dialog, shows the stored file rather than the
	// local preview.
	await expect(page.locator('button[aria-label="Open account menu"] img')).toHaveAttribute(
		'src',
		/\/api\/storage\//
	);
});

test('the well-known change-password URL opens the account dialog', async ({ page }) => {
	await signUp(page);
	await page.goto('/.well-known/change-password');
	await expect(page.getByRole('dialog', { name: 'Account' })).toBeVisible();
});

test('signed out, the well-known change-password URL asks to sign in first', async ({ page }) => {
	const username = await signUp(page);
	await signOut(page);
	await page.goto('/.well-known/change-password');
	await expect(page).toHaveURL(/\/signin\?/);
	await fillUsernameForm(page, username);
	await page.getByRole('button', { name: 'Sign in', exact: true }).click();
	await expect(page.getByRole('dialog', { name: 'Account' })).toBeVisible();
});
