import { defineConfig } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		env: {
			PUBLIC_E2E_TEST: 'true',
			...(process.env.AUTH_E2E_TEST_SECRET
				? { AUTH_E2E_TEST_SECRET: process.env.AUTH_E2E_TEST_SECRET }
				: {})
		}
	},
	testDir: 'e2e'
});
