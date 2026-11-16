import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		// The package is src/lib. The demo app around it lives next to it: its
		// Convex backend, its server setup and its components.
		alias: {
			$convex: 'src/convex',
			$demo: 'src/demo',
			$server: 'src/server'
		}
	}
};

export default config;
