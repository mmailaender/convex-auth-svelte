import { components, internal } from './_generated/api';
import { setupConvexAuth } from '@convex-dev/auth/server';
import { setupGithub } from '@convex-dev/auth/methods/github/server';
import { setupUsernamePassword } from '@convex-dev/auth/methods/username-password/server';

// The core owns sessions and JWT minting. The SvelteKit server proxies the
// sign-in functions below (see src/hooks.server.ts), so the refresh token ends
// up in an httpOnly cookie.
const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;

export const { signUpWithUsernamePassword, signInWithUsernamePassword } = setupUsernamePassword(
	auth,
	{
		component: components.authPassword,
		usernameComponent: components.authUsername
	}
).attachUserCallbacks({
	createUser: internal.users.createUser
});

export const { startSignInWithGithub, completeSignInWithGithub } = setupGithub(auth, {
	component: components.authGithub,
	// `redirectTo` of a GitHub sign-in may only point at these origins.
	allowedRedirectOrigins: ['http://localhost:5173', 'http://localhost:4173']
}).attachUserCallbacks({
	createUser: internal.users.createUser
});
