import { defineApp } from 'convex/server';
import { v } from 'convex/values';
import auth from '@convex-dev/auth/convex.config.js';
import authApple from '@convex-dev/auth/components/apple/convex.config.js';
import authEmail from '@convex-dev/auth/components/email/convex.config.js';
import authGithub from '@convex-dev/auth/components/github/convex.config.js';
import authGoogle from '@convex-dev/auth/components/google/convex.config.js';
import authPasskey from '@convex-dev/auth/components/passkey/convex.config.js';
import authPassword from '@convex-dev/auth/components/password/convex.config.js';
import authUsername from '@convex-dev/auth/components/username/convex.config.js';
import resend from '@convex-dev/resend/convex.config.js';

const app = defineApp({
	env: {
		AUTH_GITHUB_CLIENT_ID: v.string(),
		AUTH_GITHUB_CLIENT_SECRET: v.string(),
		AUTH_GOOGLE_CLIENT_ID: v.string(),
		AUTH_GOOGLE_CLIENT_SECRET: v.string(),
		AUTH_APPLE_CLIENT_ID: v.string(),
		AUTH_APPLE_TEAM_ID: v.string(),
		AUTH_APPLE_KEY_ID: v.string(),
		AUTH_APPLE_PRIVATE_KEY: v.string(),
		// Without a Resend API key, emails land in the dev inbox (see emails.ts).
		RESEND_API_KEY: v.optional(v.string()),
		SENDER_EMAIL: v.optional(v.string()),
		SENDER_NAME: v.optional(v.string()),
		// The origin the emailed links point at. Defaults to the Vite dev server.
		SITE_URL: v.optional(v.string())
	}
});

// The core owns sessions and JWTs. Each sign-in method stores its data in
// its own components.
app.use(auth);
// Usernames of username + password and username + passkey accounts.
app.use(authUsername);
app.use(authPasskey);

// Username + password and email + password each keep their passwords in their
// own instance of the password component, so their `changePassword`
// mutations stay apart.
app.use(authPassword);
app.use(authPassword, { name: 'authEmailPassword' });
app.use(authEmail);
app.use(resend);

// Each OAuth callback is mounted at `httpPrefix` on the deployment's site URL,
// e.g. https://happy-animal-123.convex.site/oauth/github/callback. Register
// that URL as the callback of the OAuth app.
app.use(authGithub, {
	httpPrefix: '/oauth/github',
	env: {
		CLIENT_ID: app.env.AUTH_GITHUB_CLIENT_ID,
		CLIENT_SECRET: app.env.AUTH_GITHUB_CLIENT_SECRET
	}
});
app.use(authGoogle, {
	httpPrefix: '/oauth/google',
	env: {
		CLIENT_ID: app.env.AUTH_GOOGLE_CLIENT_ID,
		CLIENT_SECRET: app.env.AUTH_GOOGLE_CLIENT_SECRET
	}
});
app.use(authApple, {
	httpPrefix: '/oauth/apple',
	env: {
		CLIENT_ID: app.env.AUTH_APPLE_CLIENT_ID,
		TEAM_ID: app.env.AUTH_APPLE_TEAM_ID,
		KEY_ID: app.env.AUTH_APPLE_KEY_ID,
		PRIVATE_KEY: app.env.AUTH_APPLE_PRIVATE_KEY
	}
});

export default app;
