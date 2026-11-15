import { defineConfig } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Set E2E_PORT to run beside another preview server. The backend's OAuth
// `allowedRedirectOrigins` must include the origin (see SITE_URL).
const port = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
	webServer: {
		command: `pnpm build && pnpm preview --port ${port} --strictPort`,
		port,
		reuseExistingServer: !process.env.CI
	},
	use: {
		baseURL: `http://localhost:${port}`
	},
	testDir: 'e2e'
});
