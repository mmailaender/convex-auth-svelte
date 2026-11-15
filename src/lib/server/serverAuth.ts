import { dev } from '$app/environment';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { setupConvexAuthServer } from '@convex-dev/auth/ssr';
import { api } from '$lib/convex/_generated/api';

// The framework-agnostic auth handlers from Convex Auth, configured once. The
// routes under src/routes/auth/ mount what this returns.
export const auth = setupConvexAuthServer({
	convexUrl: PUBLIC_CONVEX_URL,
	refreshSession: api.auth.refreshSession,
	signOut: api.auth.signOut,
	// Every function that signs a user in, meaning it creates a session and
	// returns its tokens. The sign-in route refuses anything else.
	signIn: [
		api.auth.signInWithUsernamePassword,
		api.auth.signUpWithUsernamePassword,
		api.auth.signInWithEmailPassword,
		api.auth.completeSignUpWithEmailPassword,
		api.auth.completePasswordRecovery,
		api.auth.finishSignUpWithUsernamePasskey,
		api.auth.finishSignInWithUsernamePasskey,
		api.auth.completeSignInWithGithub,
		api.auth.completeSignInWithGoogle,
		api.auth.completeSignInWithApple
	],
	cookieOptions: { secure: !dev }
});
