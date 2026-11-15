/**
 * The browser ceremonies of the `usernamePasskey` method: thin wrappers
 * around `navigator.credentials.create()` and `navigator.credentials.get()`.
 *
 * Adapted from `@convex-dev/auth` v2
 * (`src/methods/username-passkey/client.ts`), Copyright Convex, Inc.,
 * licensed under the Apache License 2.0. Upstream doesn't export it.
 * Upstream runs the modal ceremonies through `@simplewebauthn/browser`; this
 * port calls the WebAuthn API directly instead, so the package doesn't need
 * that dependency. The conversions match what `startRegistration` and
 * `startAuthentication` do, and the responses come out in the exact wire
 * shape of the finish mutations, which is what upstream's pruning produces.
 *
 * The functions never throw. They fold every failure into the
 * `PasskeyClientError` shape.
 *
 * @module
 */
import { fromBase64URL, toBase64URL } from './base64url.js';
import {
	foldClientError,
	type PasskeyAuthenticationResult,
	type PasskeyClientError,
	type PasskeyRegistrationResult,
	type ResolvedPasskeyCeremonies
} from './ceremonies.js';
import type {
	WireAuthenticationResponse,
	WireCreationOptions,
	WireRegistrationResponse,
	WireRequestOptions
} from './types.js';

/** Whether this browser can run WebAuthn ceremonies on this page. */
export function supportsWebAuthn(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof PublicKeyCredential !== 'undefined' &&
		window.isSecureContext
	);
}

/**
 * The modal ceremony in flight. Like `@simplewebauthn/browser`'s
 * `WebAuthnAbortService`, starting a modal ceremony aborts the previous one,
 * which then resolves as `CEREMONY_ABORTED`.
 */
let modalController: AbortController | null = null;

function newModalSignal(): AbortSignal {
	modalController?.abort();
	modalController = new AbortController();
	return modalController.signal;
}

function descriptors(
	list: WireRequestOptions['allowCredentials']
): PublicKeyCredentialDescriptor[] {
	return list.map(({ id, type, transports }) => ({
		id: fromBase64URL(id),
		type,
		...(transports !== undefined ? { transports: transports as AuthenticatorTransport[] } : {})
	}));
}

/**
 * Fold a thrown value from a registration ceremony. `InvalidStateError` is
 * the authenticator refusing to make a second passkey for a credential in
 * `excludeCredentials`.
 */
function foldRegistrationError(cause: unknown): PasskeyClientError {
	if (
		(cause instanceof Error || cause instanceof DOMException) &&
		cause.name === 'InvalidStateError'
	) {
		return { error: 'PASSKEY_ALREADY_REGISTERED' };
	}
	return foldClientError(cause);
}

/** Run a modal registration ceremony (a WebAuthn `create()` call). */
export async function register(options: WireCreationOptions): Promise<PasskeyRegistrationResult> {
	if (!supportsWebAuthn()) {
		return { success: false, userError: { error: 'WEBAUTHN_UNSUPPORTED' } };
	}
	try {
		const credential = (await navigator.credentials.create({
			publicKey: {
				...options,
				challenge: fromBase64URL(options.challenge),
				user: { ...options.user, id: fromBase64URL(options.user.id) },
				excludeCredentials: descriptors(options.excludeCredentials)
			} as PublicKeyCredentialCreationOptions,
			signal: newModalSignal()
		})) as PublicKeyCredential | null;
		if (credential === null) {
			return { success: false, userError: { error: 'CEREMONY_ABORTED' } };
		}
		return { success: true, response: attestationToJSON(credential) };
	} catch (cause) {
		return { success: false, userError: foldRegistrationError(cause) };
	}
}

/** Run a modal authentication ceremony (a WebAuthn `get()` call). */
export async function authenticate(
	options: WireRequestOptions
): Promise<PasskeyAuthenticationResult> {
	if (!supportsWebAuthn()) {
		return { success: false, userError: { error: 'WEBAUTHN_UNSUPPORTED' } };
	}
	try {
		const credential = (await navigator.credentials.get({
			publicKey: {
				challenge: fromBase64URL(options.challenge),
				timeout: options.timeout,
				rpId: options.rpId,
				// An empty list would block the discoverable-credential ceremony
				// in some browsers, so leave it out, as `@simplewebauthn/browser` does.
				...(options.allowCredentials.length > 0
					? { allowCredentials: descriptors(options.allowCredentials) }
					: {}),
				userVerification: options.userVerification
			},
			signal: newModalSignal()
		})) as PublicKeyCredential | null;
		if (credential === null) {
			return { success: false, userError: { error: 'CEREMONY_ABORTED' } };
		}
		return { success: true, response: assertionToJSON(credential) };
	} catch (cause) {
		return { success: false, userError: foldClientError(cause) };
	}
}

/**
 * Run a conditional-mediation ceremony: the request stays pending until the
 * user picks a passkey in the autocompletion list of an
 * `<input autocomplete="… webauthn">`. `signal` aborts it.
 */
export async function authenticateWithAutofill(
	options: WireRequestOptions,
	signal: AbortSignal
): Promise<PasskeyAuthenticationResult> {
	if (!supportsWebAuthn()) {
		return { success: false, userError: { error: 'WEBAUTHN_UNSUPPORTED' } };
	}
	try {
		const credential = await navigator.credentials.get({
			mediation: 'conditional',
			signal,
			publicKey: {
				challenge: fromBase64URL(options.challenge),
				timeout: options.timeout,
				rpId: options.rpId,
				// Conditional mediation requires an empty allow-list: the passkey
				// the user picks in the autocompletion list identifies the account.
				allowCredentials: [],
				userVerification: options.userVerification
			}
		});
		if (credential === null) {
			// The spec lets `get()` resolve with `null`. No assertion means no
			// ceremony, which is the same outcome for a caller as an abort.
			return { success: false, userError: { error: 'CEREMONY_ABORTED' } };
		}
		return { success: true, response: assertionToJSON(credential as PublicKeyCredential) };
	} catch (cause) {
		return { success: false, userError: foldClientError(cause) };
	}
}

/** Put a credential from a `create()` call into the wire shape. */
function attestationToJSON(credential: PublicKeyCredential): WireRegistrationResponse {
	const response = credential.response as AuthenticatorAttestationResponse;
	const transports =
		typeof response.getTransports === 'function' ? response.getTransports() : undefined;
	return {
		id: credential.id,
		rawId: toBase64URL(credential.rawId),
		response: {
			clientDataJSON: toBase64URL(response.clientDataJSON),
			attestationObject: toBase64URL(response.attestationObject),
			...(transports != null ? { transports } : {})
		},
		// The options request no extensions, so there is nothing to report.
		clientExtensionResults: {},
		type: 'public-key'
	};
}

/** Put a credential from a `get()` call into the wire shape. */
function assertionToJSON(credential: PublicKeyCredential): WireAuthenticationResponse {
	const response = credential.response as AuthenticatorAssertionResponse;
	return {
		id: credential.id,
		rawId: toBase64URL(credential.rawId),
		response: {
			clientDataJSON: toBase64URL(response.clientDataJSON),
			authenticatorData: toBase64URL(response.authenticatorData),
			signature: toBase64URL(response.signature),
			...(response.userHandle !== null ? { userHandle: toBase64URL(response.userHandle) } : {})
		},
		clientExtensionResults: {},
		type: 'public-key'
	};
}

/**
 * Whether this browser can offer passkeys in the autocompletion list of an
 * `<input autocomplete="… webauthn">`. Never throws.
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
	try {
		return (
			supportsWebAuthn() &&
			typeof PublicKeyCredential.isConditionalMediationAvailable === 'function' &&
			(await PublicKeyCredential.isConditionalMediationAvailable())
		);
	} catch {
		return false;
	}
}

// The page events after which a pending autofill request re-checks the age
// of its challenge right away: the user coming back to the page, and the
// user focusing a field (such as the username field).
const STALENESS_CHECK_WINDOW_EVENTS = ['focus', 'pageshow'] as const;
const STALENESS_CHECK_DOCUMENT_EVENTS = ['visibilitychange', 'focusin'] as const;

function onPageResume(listener: () => void): () => void {
	for (const event of STALENESS_CHECK_WINDOW_EVENTS) {
		window.addEventListener(event, listener);
	}
	for (const event of STALENESS_CHECK_DOCUMENT_EVENTS) {
		document.addEventListener(event, listener);
	}
	return () => {
		for (const event of STALENESS_CHECK_WINDOW_EVENTS) {
			window.removeEventListener(event, listener);
		}
		for (const event of STALENESS_CHECK_DOCUMENT_EVENTS) {
			document.removeEventListener(event, listener);
		}
	};
}

/** The browser ceremonies, which the hooks run. */
export const browserCeremonies: ResolvedPasskeyCeremonies = {
	isSupported: supportsWebAuthn,
	register,
	authenticate,
	isAutofillAvailable: isConditionalMediationAvailable,
	authenticateWithAutofill,
	onResume: onPageResume
};
