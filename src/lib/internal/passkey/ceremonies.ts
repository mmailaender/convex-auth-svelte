/**
 * The result shapes of a passkey ceremony, and the
 * {@link ResolvedPasskeyCeremonies} that the flows and the autofill loop run.
 *
 * Adapted from `@convex-dev/auth` v2
 * (`src/methods/username-passkey/ceremonies.ts`), Copyright Convex, Inc.,
 * licensed under the Apache License 2.0. Upstream doesn't export it. The
 * error codes match upstream's, so apps switch on the same `userError`s.
 * The pruning helpers and `resolveCeremonies` are left out: they serve
 * upstream's custom (React Native) ceremonies, which this package doesn't
 * port.
 *
 * @module
 */
import type {
	WireAuthenticationResponse,
	WireCreationOptions,
	WireRegistrationResponse,
	WireRequestOptions
} from './types.js';

/**
 * The failures the client side produces (the server never returns these):
 *
 * - `CEREMONY_ABORTED`: the user dismissed the passkey dialog, the platform
 *   refused the ceremony (`NotAllowedError`), or another ceremony displaced
 *   this one. This is the most common failure; show a calm "sign-in was
 *   cancelled" message.
 * - `PASSKEY_ALREADY_REGISTERED`: the authenticator refused a registration
 *   because it already holds a passkey for this account
 *   (`InvalidStateError`, usually via `excludeCredentials`). Tell the user
 *   they can sign in with the passkey they already have.
 * - `WEBAUTHN_UNSUPPORTED`: this browser can't run passkey ceremonies.
 * - `OTHER_ERROR`: everything else thrown (a network blip, a bug, an
 *   unexpected server error). The thrown value is on `cause`.
 */
export type PasskeyClientError =
	| { error: 'CEREMONY_ABORTED' }
	| { error: 'PASSKEY_ALREADY_REGISTERED' }
	| { error: 'WEBAUTHN_UNSUPPORTED' }
	| { error: 'OTHER_ERROR'; cause: unknown };

/**
 * A failed result with a client-side `userError`. It composes with the
 * server's own `{ success: false, userError }` results into one `userError`
 * switch.
 */
export type PasskeyClientFailure = {
	success: false;
	userError: PasskeyClientError;
};

/** The result of a registration ceremony. */
export type PasskeyRegistrationResult =
	| { success: true; response: WireRegistrationResponse }
	| PasskeyClientFailure;

/** The result of an authentication ceremony. */
export type PasskeyAuthenticationResult =
	| { success: true; response: WireAuthenticationResponse }
	| PasskeyClientFailure;

/**
 * The ceremonies of one platform. The functions never throw: they fold every
 * failure into the {@link PasskeyClientError} shape.
 */
export type ResolvedPasskeyCeremonies = {
	/** Whether this runtime can run passkey ceremonies. */
	isSupported: () => boolean;
	/** Run a modal registration ceremony. */
	register: (options: WireCreationOptions) => Promise<PasskeyRegistrationResult>;
	/** Run a modal authentication ceremony. */
	authenticate: (options: WireRequestOptions) => Promise<PasskeyAuthenticationResult>;
	/** Whether this runtime can offer passkeys in the autocompletion list of a field. */
	isAutofillAvailable: () => Promise<boolean>;
	/**
	 * Run a conditional-mediation ceremony, which stays pending until the
	 * user picks a passkey in the autocompletion list. `signal` aborts it.
	 */
	authenticateWithAutofill: (
		options: WireRequestOptions,
		signal: AbortSignal
	) => Promise<PasskeyAuthenticationResult>;
	/**
	 * Call `listener` when the user may have come back to the page after a
	 * pause, so the autofill flow can refresh a stale challenge. Returns the
	 * unsubscribe function.
	 */
	onResume: (listener: () => void) => () => void;
};

/** Whether `cause` is a `DOMException`, which is not a global in every runtime. */
function isDOMException(cause: unknown): cause is DOMException {
	return typeof DOMException !== 'undefined' && cause instanceof DOMException;
}

/**
 * Fold a thrown value into the {@link PasskeyClientError} shape.
 *
 * `NotAllowedError` is what the browser throws when the user dismisses the
 * dialog, when the ceremony times out, and when the page may not run one.
 * `AbortError` is a ceremony that another one displaced.
 */
export function foldClientError(cause: unknown): PasskeyClientError {
	// `DOMException` does not extend `Error` in every runtime.
	if (cause instanceof Error || isDOMException(cause)) {
		if (cause.name === 'NotAllowedError' || cause.name === 'AbortError') {
			return { error: 'CEREMONY_ABORTED' };
		}
	}
	return { error: 'OTHER_ERROR', cause };
}
