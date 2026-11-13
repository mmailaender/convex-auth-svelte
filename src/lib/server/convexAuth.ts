import { createConvexAuthHooks } from '$lib/sveltekit/server';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/convex/_generated/api';

// Configured once, used by src/hooks.server.ts and the load functions.
export const { handleAuth, getAuthState, isAuthenticated } = createConvexAuthHooks({
	convexUrl: PUBLIC_CONVEX_URL,
	api: api.auth,
	// Every function that signs a user in. The sign-in route refuses anything
	// else.
	signIn: [
		api.auth.signInWithUsernamePassword,
		api.auth.signUpWithUsernamePassword,
		api.auth.completeSignInWithGithub
	],
	verbose: true
});
