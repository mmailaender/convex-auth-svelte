/**
 * Which sign-in methods the demo offers, and how it brands its sign-in card.
 *
 * Each method needs its functions in `src/convex/auth.ts`, and the
 * functions that create a session in the `signIn` list of
 * `src/server/serverAuth.server.ts`. Turning a method off here only hides it.
 */
export const AUTH_CONFIG = {
	brandName: 'Convex Auth',
	tagline: 'Sign in to the Svelte reference app.',
	methods: {
		emailPassword: true,
		usernamePassword: true,
		usernamePasskey: true,
		github: true,
		google: true,
		apple: true
	},
	/** Links shown under the sign-in card. Leave empty to hide them. */
	termsUrl: '' as string,
	privacyUrl: '' as string
} as const;

/** The sign-in methods a user can have. Each account has exactly one. */
export type SignInMethod =
	| 'emailPassword'
	| 'usernamePassword'
	| 'usernamePasskey'
	| 'github'
	| 'google'
	| 'apple';

export const METHOD_LABELS: Record<string, string> = {
	emailPassword: 'Email and password',
	usernamePassword: 'Username and password',
	usernamePasskey: 'Passkey',
	github: 'GitHub',
	google: 'Google',
	apple: 'Apple'
};

/** Whether accounts of this method sign in with a password. */
export function hasPassword(method: string | undefined): boolean {
	return method === 'emailPassword' || method === 'usernamePassword';
}
