/**
 * Svelte client for the `usernamePasskey` method of Convex Auth v2. The
 * counterpart of `@convex-dev/auth/methods/username-passkey/react`.
 *
 * {@link useSignInWithUsernamePasskey} drives the login form: the
 * identifier-first flow (a free username creates an account with a new
 * passkey, an existing one asks for its passkey) and passkey autofill, where
 * the user picks an account straight from the autocompletion list of the
 * username field. {@link useAddPasskey} and {@link useRemovePasskey} drive the
 * passkey settings of a signed-in user. Listing and renaming passkeys are a
 * plain query and mutation (`api.auth.listPasskeys`, `api.auth.renamePasskey`)
 * that you call with `convex-svelte`.
 *
 * Every helper must be called during component initialization. Read
 * `pending` and the `autofill` fields from the returned objects (don't
 * destructure them), so they stay reactive.
 *
 * Under SvelteKit, add `finishSignUpWithUsernamePasskey` and
 * `finishSignInWithUsernamePasskey` to the `signIn` list of
 * `setupConvexAuthServer`. The other functions run on the Convex client and
 * aren't listed.
 *
 * @module
 */
import { getConvexAuthContext } from '../internal/core.svelte.js';
import { browserCeremonies } from '../internal/passkey/client.js';
import {
	createCeremonySlot,
	createPasskeyAutofill,
	type AlreadyPendingError,
	type AlreadyPendingFailure,
	type PasskeyAutofillStatus
} from '../internal/passkey/autofill.svelte.js';
import {
	runAddPasskeyFlow,
	runRemovePasskeyFlow,
	runSignInOrSignUpFlow,
	type AddPasskeyFlowResult,
	type RemovePasskeyFlowResult,
	type SignInFlowResult,
	type UsernamePasskeyAutofillError
} from '../internal/passkey/flows.js';
import type { PasskeyClientError } from '../internal/passkey/ceremonies.js';
import type {
	AddPasskeyApi,
	RemovePasskeyApi,
	SignInError,
	UsernamePasskeyApi
} from '../internal/passkey/types.js';

export type {
	AlreadyPendingFailure,
	PasskeyAutofillStatus
} from '../internal/passkey/autofill.svelte.js';
export type { UsernamePasskeyAutofillError } from '../internal/passkey/flows.js';
export type { PasskeyClientError, PasskeyClientFailure } from '../internal/passkey/ceremonies.js';
export type {
	AddPasskeyApi,
	ListPasskeysResult,
	RemovePasskeyApi,
	RenamePasskeyResult,
	UsernamePasskeyApi,
	WireAuthenticationResponse,
	WireCreationOptions,
	WireRegistrationResponse,
	WireRequestOptions
} from '../internal/passkey/types.js';

/**
 * What `signIn` of {@link useSignInWithUsernamePasskey} resolves to. A
 * completed sign-in carries a `flow` discriminant: `"signUp"` when the
 * ceremony created a new account, `"signIn"` when it authenticated an
 * existing one. `ALREADY_PENDING` comes back when `signIn` runs while the
 * previous call still does, or while an autofill sign-in is verified.
 */
export type SignInWithUsernamePasskeyResult =
	| SignInFlowResult
	| SignInError<PasskeyClientError | AlreadyPendingError>;

/** What `addPasskey` of {@link useAddPasskey} resolves to. */
export type AddPasskeyResult = AddPasskeyFlowResult | AlreadyPendingFailure;

/** What `removePasskey` of {@link useRemovePasskey} resolves to. */
export type RemovePasskeyResult = RemovePasskeyFlowResult | AlreadyPendingFailure;

/**
 * The login form of the username + passkey method. Call during component
 * initialization.
 *
 * While the component is mounted, the browser also offers the stored
 * passkeys in the autocompletion list of the username field, which must
 * carry `autocomplete="username webauthn"`. Picking one signs in directly.
 * The browser allows one such request at a time, so mount this helper once
 * per page.
 *
 * ```svelte
 * <script lang="ts">
 *   import { useSignInWithUsernamePasskey } from '@mmailaender/convex-auth-svelte/methods/username-passkey';
 *   import { api } from '$convex/_generated/api';
 *
 *   const login = useSignInWithUsernamePasskey(api.auth);
 *   let username = $state('');
 *   let error = $state<string | null>(null);
 *
 *   async function onsubmit(event: SubmitEvent) {
 *     event.preventDefault();
 *     error = null;
 *     const result = await login.signIn({ username });
 *     if (result.status === 'error') error = result.userError.error;
 *   }
 * </script>
 *
 * <form {onsubmit}>
 *   <input autocomplete="username webauthn" required bind:value={username} disabled={login.pending} />
 *   {#if error}<p role="alert">{error}</p>{/if}
 *   {#if login.autofill.lastError}<p role="alert">{login.autofill.lastError.error}</p>{/if}
 *   <button disabled={login.pending}>Continue with a passkey</button>
 * </form>
 * ```
 *
 * @param usernamePasskeyApi The functions of the method, usually `api.auth`.
 */
export function useSignInWithUsernamePasskey(usernamePasskeyApi: UsernamePasskeyApi) {
	const { authClient, signInApi, mutation } = getConvexAuthContext(
		'useSignInWithUsernamePasskey()'
	);
	const ceremonies = browserCeremonies;
	const ctx = {
		mutation,
		api: usernamePasskeyApi,
		signInApi,
		setSession: authClient.setSession,
		ceremonies
	};

	const autofill = createPasskeyAutofill<UsernamePasskeyAutofillError>({
		ceremonies,
		start: async () => {
			const { options } = await mutation(
				usernamePasskeyApi.startAutofillSignInWithUsernamePasskey,
				{}
			);
			return options;
		},
		onAssertion: async (response) => {
			const result = await signInApi.mutation(usernamePasskeyApi.finishSignInWithUsernamePasskey, {
				response
			});
			if (result.status !== 'complete') {
				// The loop retries on a failed assertion, so it takes its own
				// `success` boolean rather than the sign-in envelope.
				return { success: false, userError: result.userError };
			}
			await authClient.setSession(result.tokens);
			return { success: true };
		}
	});

	const slot = createCeremonySlot(autofill);

	return {
		/**
		 * Run the identifier-first passkey flow for the username. Resolves to a
		 * result, never rejects: `status` is `"complete"` (with `flow`) or
		 * `"error"` (with `userError`).
		 */
		signIn: async ({
			username
		}: {
			username: string;
		}): Promise<SignInWithUsernamePasskeyResult> => {
			const result = await slot.run(() => runSignInOrSignUpFlow(ctx, { username }));
			if ('status' in result) {
				return result;
			}
			// A failure of the slot itself: a thrown error, or `ALREADY_PENDING`.
			return { status: 'error', userError: result.userError };
		},
		/**
		 * `true` while a sign-in runs: a `signIn` call, or an autofill sign-in
		 * that the server verifies. A `signIn` call in this time returns
		 * `ALREADY_PENDING`.
		 */
		get pending() {
			return slot.pending || autofill.status === 'signingIn';
		},
		/** The state of the autofill flow. */
		autofill: {
			/**
			 * Whether the browser can offer passkeys in the autocompletion list;
			 * `null` while the detection runs.
			 */
			get available(): boolean | null {
				return autofill.available;
			},
			/** The state of the request; see {@link PasskeyAutofillStatus}. */
			get status(): PasskeyAutofillStatus {
				return autofill.status;
			},
			/** The most recent failure, for display or logging. */
			get lastError(): UsernamePasskeyAutofillError | null {
				return autofill.lastError;
			}
		}
	};
}

/**
 * The "Add a passkey" button of a settings page. Call during component
 * initialization.
 *
 * The user first authenticates with an existing passkey to prove their
 * identity, then registers the new one.
 *
 * ```svelte
 * <script lang="ts">
 *   const adder = useAddPasskey(api.auth);
 * </script>
 *
 * <button
 *   disabled={adder.pending}
 *   onclick={async () => {
 *     const result = await adder.addPasskey();
 *     if (!result.success) console.log(result.userError.error);
 *   }}
 * >
 *   Add a passkey
 * </button>
 * ```
 *
 * @param managementApi The passkey-management functions, usually `api.auth`.
 */
export function useAddPasskey(managementApi: AddPasskeyApi) {
	const { mutation } = getConvexAuthContext('useAddPasskey()');
	// Not a login page, so there is no autofill to pause.
	const slot = createCeremonySlot(null);
	const ctx = { mutation, api: managementApi, ceremonies: browserCeremonies };
	return {
		/**
		 * Add a passkey to the account of the signed-in user. Resolves to
		 * `{ success }`, never rejects; on failure, `userError` tells why.
		 */
		addPasskey: (): Promise<AddPasskeyResult> => slot.run(() => runAddPasskeyFlow(ctx)),
		/** `true` while an `addPasskey` call runs. */
		get pending() {
			return slot.pending;
		}
	};
}

/**
 * The "Remove" button of a passkey list. Call during component
 * initialization.
 *
 * The user authenticates with another passkey of the account before the
 * passkey is deleted, so the last passkey can't be removed (`LAST_PASSKEY`).
 *
 * @param managementApi The passkey-management functions, usually `api.auth`.
 */
export function useRemovePasskey(managementApi: RemovePasskeyApi) {
	const { mutation } = getConvexAuthContext('useRemovePasskey()');
	const slot = createCeremonySlot(null);
	const ctx = { mutation, api: managementApi, ceremonies: browserCeremonies };
	return {
		/**
		 * Remove the passkey from the account of the signed-in user. Resolves
		 * to `{ success }`, never rejects; on failure, `userError` tells why.
		 */
		removePasskey: (passkeyId: string): Promise<RemovePasskeyResult> =>
			slot.run(() => runRemovePasskeyFlow(ctx, { passkeyId })),
		/** `true` while a `removePasskey` call runs. */
		get pending() {
			return slot.pending;
		}
	};
}
