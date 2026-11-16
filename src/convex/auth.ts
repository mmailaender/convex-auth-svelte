import { components, internal } from './_generated/api';
import { setupConvexAuth } from '@convex-dev/auth/server';
import { setupGithub } from '@convex-dev/auth/methods/github/server';
import { setupUsernamePasskey } from '@convex-dev/auth/methods/username-passkey/server';
import { setupUsernamePassword } from '@convex-dev/auth/methods/username-password/server';

// The core owns sessions and JWT minting. The SvelteKit server proxies the
// sign-in functions below (see src/server/serverAuth.server.ts), so the refresh token ends
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

export const {
	startSignInWithUsernamePasskey,
	startAutofillSignInWithUsernamePasskey,
	finishSignUpWithUsernamePasskey,
	finishSignInWithUsernamePasskey,

	listPasskeys,
	renamePasskey,

	startAddPasskey,
	verifyAddPasskey,
	finishAddPasskey,

	startRemovePasskey,
	finishRemovePasskey
} = setupUsernamePasskey(auth, {
	component: components.authPasskey,
	usernameComponent: components.authUsername,
	// Passkeys are bound to `rpId` for good: a passkey made on `localhost`
	// never works on another domain. `origin` lists the dev server and the
	// preview server the e2e tests run against.
	rpId: 'localhost',
	origin: ['http://localhost:4173', 'http://localhost:5173']
}).attachUserCallbacks({
	createUser: internal.users.createUser
});
