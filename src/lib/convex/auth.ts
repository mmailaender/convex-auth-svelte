import { components, internal } from './_generated/api';
import { env } from './_generated/server';
import { makeFunctionReference } from 'convex/server';
import { setupConvexAuth } from '@convex-dev/auth/server';
import { setupApple } from '@convex-dev/auth/methods/apple/server';
import { setupEmailPassword } from '@convex-dev/auth/methods/email-password/server';
import { setupGithub } from '@convex-dev/auth/methods/github/server';
import { setupGoogle } from '@convex-dev/auth/methods/google/server';
import { setupUsernamePassword } from '@convex-dev/auth/methods/username-password/server';

// The frontend origin that the emailed links point at.
const SITE_URL = env.SITE_URL ?? 'http://localhost:5173';

// `redirectTo` of an OAuth sign-in may only point at these origins.
const allowedRedirectOrigins = [SITE_URL, 'http://localhost:5173', 'http://localhost:4173'];

// The core owns sessions and JWT minting. The SvelteKit server proxies the
// sign-in functions below (see src/lib/server/serverAuth.ts), so the refresh
// token ends up in an httpOnly cookie.
const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;

const userCallbacks = { createUser: internal.users.createUser };

export const {
	signUpWithUsernamePassword,
	signInWithUsernamePassword,
	changePassword: changeUsernamePassword
} = setupUsernamePassword(auth, {
	component: components.authPassword,
	usernameComponent: components.authUsername
}).attachUserCallbacks(userCallbacks);

export const {
	signUpWithEmailPassword,
	completeSignUpWithEmailPassword,
	signInWithEmailPassword,
	changePassword: changeEmailPassword,
	startChangeEmail,
	completeChangeEmail,
	startPasswordRecovery,
	checkPasswordRecovery,
	completePasswordRecovery
} = setupEmailPassword(auth, {
	component: components.authEmail,
	passwordComponent: components.authEmailPassword,
	emailSender: {
		kind: 'resend',
		// Resend when RESEND_API_KEY is set, the dev inbox otherwise. Referenced
		// by name, because `internal.emails.send` would make the types of this
		// module depend on themselves.
		sendEmail: makeFunctionReference<'mutation'>(
			'emails:send'
		) as unknown as typeof components.resend.lib.sendEmail,
		apiKey: env.RESEND_API_KEY ?? 'dev-inbox',
		// SENDER_EMAIL must be on a domain you verified with Resend.
		from: `${env.SENDER_NAME ?? 'Convex Auth Svelte'} <${env.SENDER_EMAIL ?? 'auth@example.com'}>`
	},
	urls: {
		signUp: `${SITE_URL}/validate-email`,
		changeEmail: `${SITE_URL}/confirm-email-change`,
		recovery: `${SITE_URL}/reset-password`
	}
}).attachUserCallbacks(userCallbacks);

export const { startSignInWithGithub, completeSignInWithGithub } = setupGithub(auth, {
	component: components.authGithub,
	allowedRedirectOrigins
}).attachUserCallbacks(userCallbacks);

export const { startSignInWithGoogle, completeSignInWithGoogle } = setupGoogle(auth, {
	component: components.authGoogle,
	allowedRedirectOrigins
}).attachUserCallbacks(userCallbacks);

export const { startSignInWithApple, completeSignInWithApple } = setupApple(auth, {
	component: components.authApple,
	allowedRedirectOrigins
}).attachUserCallbacks(userCallbacks);
