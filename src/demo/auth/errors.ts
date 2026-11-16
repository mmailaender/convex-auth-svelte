/**
 * User-facing messages for the errors Convex Auth returns.
 *
 * Every helper of `@mmailaender/convex-auth-svelte/methods/*` resolves to a
 * result with a typed `userError` instead of throwing. The codes are shared
 * across methods, so one lookup serves every form; a form passes `overrides`
 * where its context calls for other wording.
 */

/** A `userError` of any Convex Auth helper. */
export type AuthUserError = { error: string; cause?: unknown } & Record<string, unknown>;

type Messages = Partial<Record<string, string | ((userError: AuthUserError) => string)>>;

function seconds(ms: unknown): number {
	return Math.max(1, Math.ceil(Number(ms) / 1000));
}

const MESSAGES: Messages = {
	// Credentials
	INVALID_CREDENTIALS: 'Incorrect username or password.',
	USER_NOT_FOUND: 'No account exists with these details.',
	NOT_LOGGED_IN: 'Your session has ended. Sign in again.',
	RATE_LIMITED: (e) => `Too many attempts. Try again in ${seconds(e.retryAfterMs)} seconds.`,

	// Passwords
	PASSWORD_TOO_SHORT: (e) => `Use at least ${e.minimumLength} characters.`,
	PASSWORD_TOO_LONG: (e) => `Use at most ${e.maximumLength} characters.`,
	PASSWORD_HAS_SURROUNDING_WHITESPACE: "A password can't start or end with a space.",
	PASSWORD_TOO_COMMON: 'This password is one of the most common ones. Choose another.',

	// Usernames
	USERNAME_TAKEN: 'That username is taken.',
	USERNAME_TOO_SHORT: (e) => `A username has at least ${e.minimumLength} characters.`,
	USERNAME_TOO_LONG: (e) => `A username has at most ${e.maximumLength} characters.`,
	USERNAME_HAS_SURROUNDING_WHITESPACE: "A username can't start or end with a space.",
	USERNAME_HAS_INVALID_CHARACTERS: "That username contains characters that aren't allowed.",

	// Email addresses
	INVALID_EMAIL: "That email address doesn't look valid.",
	EMAIL_TAKEN: 'An account already uses this email address.',
	EMAIL_NOT_FOUND: 'No account exists with this email address.',

	// Email links
	MISSING_SECRET:
		'For your security, this link only works in the browser that asked for it. Open it there, or start over in this browser.',
	INVALID_CHALLENGE: 'This link is no longer valid. It may have expired or already been used.',
	INCORRECT_CODE: "This isn't the latest link. Open the newest email we sent you.",
	WRONG_USER:
		'This link belongs to another account. Sign in with the account that asked for it, then open the link again.',

	// OAuth
	ACCESS_DENIED: 'The sign-in was cancelled.',
	EXPIRED: 'The sign-in took too long. Try again.',
	INVALID_FLOW: "The sign-in couldn't be completed. Try again.",

	// Passkeys
	CEREMONY_ABORTED: 'The passkey prompt was closed. Try again.',
	WEBAUTHN_UNSUPPORTED: "This browser doesn't support passkeys.",
	PASSKEY_ALREADY_REGISTERED:
		'This device already holds a passkey for this site. Sign in with it instead.',
	CHALLENGE_EXPIRED: 'The passkey prompt stayed open too long. Try again.',
	UNKNOWN_CREDENTIAL: "This passkey isn't registered here.",
	PROTOCOL_ERROR: "This passkey request couldn't be verified. Try again.",
	LAST_PASSKEY: "You can't remove your only passkey. Add another one first.",
	TOO_MANY_PASSKEYS: 'You have too many passkeys. Remove one before you add another.',
	PASSKEY_NOT_FOUND: 'This passkey no longer exists.',
	INVALID_NAME: 'A passkey name has 1 to 50 characters on one line.',

	OTHER_ERROR: 'Something went wrong. Try again.'
};

/** The message to show for `userError`. Unknown codes get a generic message. */
export function authErrorMessage(userError: AuthUserError, overrides: Messages = {}): string {
	if (userError.error === 'OTHER_ERROR' && userError.cause !== undefined) {
		console.error(userError.cause);
	}
	const message = overrides[userError.error] ?? MESSAGES[userError.error] ?? MESSAGES.OTHER_ERROR!;
	return typeof message === 'function' ? message(userError) : message;
}
