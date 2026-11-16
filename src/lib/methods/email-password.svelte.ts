/**
 * Svelte client for the `emailPassword` method of Convex Auth v2. The
 * counterpart of `@convex-dev/auth/methods/email-password/react`.
 *
 * Sign-up, password recovery and email change finish with a link from an
 * email. The flow keeps a secret in the storage of the browser that started
 * it, and the link only works in that browser.
 *
 * Every helper must be called during component initialization. Read
 * `pending` and `current` from the returned objects (don't destructure them),
 * so they stay reactive.
 *
 * @module
 */
import { untrack } from 'svelte';
import { useQuery } from 'convex-svelte';
import type { FunctionReference } from 'convex/server';
import type {
	SignUpResult as SignUpMutationResult,
	CompleteSignUpResult,
	SignInResult as SignInMutationResult,
	StartChangeEmailResult as StartChangeEmailMutationResult,
	CompleteChangeEmailResult,
	StartPasswordRecoveryResult as StartPasswordRecoveryMutationResult,
	CheckPasswordRecoveryResult as CheckPasswordRecoveryQueryResult,
	CompletePasswordRecoveryResult as CompletePasswordRecoveryMutationResult
} from '@convex-dev/auth/methods/email-password/server';
import { getConvexAuthContext, type ConvexAuthContext } from '../internal/core.svelte.js';
import type { ClientView } from './shared.js';

export { DEFAULT_MIN_PASSWORD_LENGTH } from '@convex-dev/auth/methods/email-password';

/** The flows that the user completes with a link from an email. */
type EmailLinkFlow = 'signUp' | 'changeEmail' | 'passwordRecovery';

// The same keys as `@convex-dev/auth/methods/email-password/react`.
const SECRET_STORAGE_KEYS: Record<EmailLinkFlow, string> = {
	signUp: '__convexAuthEmailPasswordSignUpSecret',
	changeEmail: '__convexAuthEmailPasswordChangeEmailSecret',
	passwordRecovery: '__convexAuthEmailPasswordRecoverySecret'
};

//------------------------------------------------------------------------------
// Result types
//------------------------------------------------------------------------------

type ExtractError<Result> = Result extends { success: false; userError: infer UserError }
	? UserError
	: never;

type SignInError<Result> = Result extends { status: 'error'; userError: infer UserError }
	? UserError
	: never;

/** The mutation threw rather than resolving to a `userError`. */
type OtherError = { error: 'OTHER_ERROR'; cause: unknown };

/**
 * The link was opened in a browser that did not start the flow. Tell the user
 * to open it in the browser they started from.
 */
type MissingSecretError = { error: 'MISSING_SECRET' };

type UnexpectedFailure = { success: false; userError: OtherError };
type SignInUnexpectedFailure = { status: 'error'; userError: OtherError };

/** A "start" result without the `browserSecret`, which the helper stores. */
type WithoutSecret<Result> = Result extends { success: true }
	? Omit<Result, 'browserSecret'>
	: Result;

type SignUpMutation = FunctionReference<
	'mutation',
	'public',
	{ email: string; password: string },
	ClientView<SignUpMutationResult>
>;
type CompleteSignUpMutation = FunctionReference<
	'mutation',
	'public',
	{ emailCode: string; browserSecret: string },
	ClientView<CompleteSignUpResult>
>;
type SignInMutation = FunctionReference<
	'mutation',
	'public',
	{ email: string; password: string },
	ClientView<SignInMutationResult>
>;
type StartChangeEmailMutation = FunctionReference<
	'mutation',
	'public',
	{ newEmail: string; currentPassword: string },
	StartChangeEmailMutationResult
>;
type CompleteChangeEmailMutation = FunctionReference<
	'mutation',
	'public',
	{ emailCode: string; browserSecret: string },
	CompleteChangeEmailResult
>;
type StartPasswordRecoveryMutation = FunctionReference<
	'mutation',
	'public',
	{ email: string },
	StartPasswordRecoveryMutationResult
>;
type CheckPasswordRecoveryQuery = FunctionReference<
	'query',
	'public',
	{ emailCode: string; browserSecret: string },
	CheckPasswordRecoveryQueryResult
>;
type CompletePasswordRecoveryMutation = FunctionReference<
	'mutation',
	'public',
	{ emailCode: string; browserSecret: string; newPassword: string },
	ClientView<CompletePasswordRecoveryMutationResult>
>;

/** The functions that {@link useCompletePasswordRecovery} calls. */
export type PasswordRecoveryApi = {
	checkPasswordRecovery: CheckPasswordRecoveryQuery;
	completePasswordRecovery: CompletePasswordRecoveryMutation;
};

export type SignInResult = ClientView<SignInMutationResult> | SignInUnexpectedFailure;
export type SignUpResult = WithoutSecret<ClientView<SignUpMutationResult>> | UnexpectedFailure;
export type StartChangeEmailResult =
	| WithoutSecret<StartChangeEmailMutationResult>
	| UnexpectedFailure;
export type StartPasswordRecoveryResult =
	| WithoutSecret<StartPasswordRecoveryMutationResult>
	| UnexpectedFailure;
export type CompletePasswordRecoveryResult =
	| ClientView<CompletePasswordRecoveryMutationResult>
	| SignInUnexpectedFailure;

/** The state of a flow that completes on its own when the link is opened. */
export type LinkFlowState<UserError> =
	| { status: 'loading' }
	| { status: 'complete' }
	| { status: 'error'; userError: UserError };

export type CompleteSignUpState = LinkFlowState<
	SignInError<ClientView<CompleteSignUpResult>> | MissingSecretError | OtherError
>;

export type CompleteChangeEmailState = LinkFlowState<
	ExtractError<CompleteChangeEmailResult> | MissingSecretError | OtherError
>;

type PasswordRecoveryLinkError = ExtractError<CheckPasswordRecoveryQueryResult>;

const PASSWORD_RECOVERY_LINK_ERRORS: Record<PasswordRecoveryLinkError['error'], true> = {
	INVALID_CHALLENGE: true,
	INCORRECT_CODE: true
};

function isPasswordRecoveryLinkError(
	userError: SignInError<ClientView<CompletePasswordRecoveryMutationResult>>
): userError is PasswordRecoveryLinkError {
	return userError.error in PASSWORD_RECOVERY_LINK_ERRORS;
}

export type CompletePasswordRecoveryState =
	| { status: 'loading' }
	| {
			status: 'ready';
			/**
			 * Set the new password and sign the user in. Errors about the new
			 * password come back in the result and leave the state `ready`, so the
			 * user can try another password with the same link.
			 */
			completePasswordRecovery: (args: {
				newPassword: string;
			}) => Promise<CompletePasswordRecoveryResult>;
			/** `true` while `completePasswordRecovery` is in flight. */
			pending: boolean;
	  }
	| { status: 'complete' }
	| {
			status: 'error';
			/** `OTHER_ERROR` when checking the link failed, e.g. the backend threw. */
			userError: PasswordRecoveryLinkError | MissingSecretError | OtherError;
	  };

//------------------------------------------------------------------------------
// Shared helpers
//------------------------------------------------------------------------------

/** Track in-flight calls; `pending` is true while any runs. */
function createPending() {
	let inFlight = $state(0);
	return {
		get pending() {
			return inFlight > 0;
		},
		async track<T>(work: () => Promise<T>): Promise<T> {
			inFlight++;
			try {
				return await work();
			} finally {
				inFlight--;
			}
		}
	};
}

const foldError = (cause: unknown): UnexpectedFailure => ({
	success: false,
	userError: { error: 'OTHER_ERROR', cause }
});

const foldSignInError = (cause: unknown): SignInUnexpectedFailure => ({
	status: 'error',
	userError: { error: 'OTHER_ERROR', cause }
});

/**
 * Complete a link flow once the session has loaded, with the secret this
 * browser stored when the flow started.
 */
function linkFlow<UserError>(
	context: ConvexAuthContext,
	flow: EmailLinkFlow,
	complete: (
		browserSecret: string
	) => Promise<{ done: true } | { done: false; userError: UserError }>
): { readonly current: LinkFlowState<UserError | MissingSecretError | OtherError> } {
	const { storage, clientState } = context;
	let state = $state<LinkFlowState<UserError | MissingSecretError | OtherError>>({
		status: 'loading'
	});
	let started = false;

	$effect(() => {
		if (clientState.isLoading || started) {
			return;
		}
		started = true;
		void untrack(async () => {
			try {
				const browserSecret = await storage.get(SECRET_STORAGE_KEYS[flow]);
				if (browserSecret === null || browserSecret === undefined) {
					state = { status: 'error', userError: { error: 'MISSING_SECRET' } };
					return;
				}
				const result = await complete(browserSecret);
				if (result.done) {
					await storage.remove(SECRET_STORAGE_KEYS[flow]);
					state = { status: 'complete' };
				} else {
					state = { status: 'error', userError: result.userError };
				}
			} catch (cause) {
				state = { status: 'error', userError: { error: 'OTHER_ERROR', cause } };
			}
		});
	});

	return {
		get current() {
			return state;
		}
	};
}

//------------------------------------------------------------------------------
// Sign-in
//------------------------------------------------------------------------------

/**
 * Sign in with an email and password.
 *
 * ```svelte
 * <script lang="ts">
 *   const login = useSignInWithEmailPassword(api.auth);
 *   // const result = await login.signIn({ email, password });
 * </script>
 * ```
 */
export function useSignInWithEmailPassword(api: { signInWithEmailPassword: SignInMutation }) {
	const { authClient, signInApi } = getConvexAuthContext('useSignInWithEmailPassword()');
	const tracker = createPending();
	return {
		/** Sign in. Resolves to a result, never rejects. */
		signIn: (credentials: { email: string; password: string }): Promise<SignInResult> =>
			tracker.track(async () => {
				try {
					const result = await signInApi.mutation(api.signInWithEmailPassword, credentials);
					if (result.status === 'complete') {
						await authClient.setSession(result.tokens);
					}
					return result;
				} catch (cause) {
					return foldSignInError(cause);
				}
			}),
		/** `true` while the credentials are being validated. */
		get pending() {
			return tracker.pending;
		}
	};
}

//------------------------------------------------------------------------------
// Sign-up
//------------------------------------------------------------------------------

/**
 * Start a sign-up. On success, the backend emails a link to the address, and
 * the page that link opens calls {@link useCompleteSignUpWithEmailPassword}.
 */
export function useSignUpWithEmailPassword(api: { signUpWithEmailPassword: SignUpMutation }) {
	const { mutation, storage } = getConvexAuthContext('useSignUpWithEmailPassword()');
	const tracker = createPending();
	return {
		/** Start the sign-up. Resolves to a result, never rejects. */
		signUp: (credentials: { email: string; password: string }): Promise<SignUpResult> =>
			tracker.track(async () => {
				try {
					const result = await mutation(api.signUpWithEmailPassword, credentials);
					if (result.success) {
						await storage.set(SECRET_STORAGE_KEYS.signUp, result.browserSecret);
						return { success: true };
					}
					return result;
				} catch (cause) {
					return foldError(cause);
				}
			}),
		/** `true` while the sign-up is being started. */
		get pending() {
			return tracker.pending;
		}
	};
}

/**
 * Finish a sign-up from the link in the email, which signs the user in. Runs
 * on its own once the session has loaded; render from `current`.
 *
 * @param options.emailCode The code from the link, e.g. `page.url.searchParams.get('code')`.
 */
export function useCompleteSignUpWithEmailPassword(
	api: { completeSignUpWithEmailPassword: CompleteSignUpMutation },
	{ emailCode }: { emailCode: string }
): { readonly current: CompleteSignUpState } {
	const context = getConvexAuthContext('useCompleteSignUpWithEmailPassword()');
	const { authClient, signInApi } = context;
	return linkFlow<SignInError<ClientView<CompleteSignUpResult>>>(
		context,
		'signUp',
		(browserSecret) =>
			authClient.withSignInPending(async () => {
				const result = await signInApi.mutation(api.completeSignUpWithEmailPassword, {
					emailCode,
					browserSecret
				});
				if (result.status === 'complete') {
					await authClient.setSession(result.tokens);
					return { done: true } as const;
				}
				return { done: false, userError: result.userError } as const;
			})
	);
}

//------------------------------------------------------------------------------
// Password recovery
//------------------------------------------------------------------------------

/**
 * Start a password recovery. On success, the backend emails a link, and the
 * page that link opens calls {@link useCompletePasswordRecovery}.
 */
export function useStartPasswordRecovery(api: {
	startPasswordRecovery: StartPasswordRecoveryMutation;
}) {
	const { mutation, storage } = getConvexAuthContext('useStartPasswordRecovery()');
	const tracker = createPending();
	return {
		/** Start the recovery. Resolves to a result, never rejects. */
		startPasswordRecovery: (args: { email: string }): Promise<StartPasswordRecoveryResult> =>
			tracker.track(async () => {
				try {
					const result = await mutation(api.startPasswordRecovery, args);
					if (result.success) {
						await storage.set(SECRET_STORAGE_KEYS.passwordRecovery, result.browserSecret);
						return { success: true, sentTo: result.sentTo };
					}
					return result;
				} catch (cause) {
					return foldError(cause);
				}
			}),
		/** `true` while the recovery is being started. */
		get pending() {
			return tracker.pending;
		}
	};
}

/**
 * Finish a password recovery from the link in the email. Checks the link
 * once the session has loaded; when `current.status` is `"ready"`, ask for
 * the new password and call `current.completePasswordRecovery`.
 *
 * @param recoveryApi The functions of the method, usually `api.auth`.
 * @param options.emailCode The code from the link.
 */
export function useCompletePasswordRecovery(
	recoveryApi: PasswordRecoveryApi,
	{ emailCode }: { emailCode: string }
): { readonly current: CompletePasswordRecoveryState } {
	const { authClient, signInApi, storage, clientState } = getConvexAuthContext(
		'useCompletePasswordRecovery()'
	);
	const tracker = createPending();
	// `undefined` until read, `null` when this browser has no secret.
	let browserSecret = $state<string | null | undefined>(undefined);
	let outcome = $state<Extract<CompletePasswordRecoveryState, { status: 'complete' | 'error' }>>();
	let read = false;

	$effect(() => {
		if (clientState.isLoading || read) {
			return;
		}
		read = true;
		void untrack(async () => {
			const secret = await storage.get(SECRET_STORAGE_KEYS.passwordRecovery);
			browserSecret = secret ?? null;
		});
	});

	const check = useQuery(recoveryApi.checkPasswordRecovery, () =>
		typeof browserSecret === 'string' ? { emailCode, browserSecret } : 'skip'
	);

	const completePasswordRecovery = ({
		newPassword
	}: {
		newPassword: string;
	}): Promise<CompletePasswordRecoveryResult> =>
		tracker.track(async () => {
			const secret = browserSecret;
			if (typeof secret !== 'string') {
				throw new Error('completePasswordRecovery was called before the flow was ready');
			}
			try {
				const result = await signInApi.mutation(recoveryApi.completePasswordRecovery, {
					emailCode,
					browserSecret: secret,
					newPassword
				});
				if (result.status === 'complete') {
					await authClient.setSession(result.tokens);
					await storage.remove(SECRET_STORAGE_KEYS.passwordRecovery);
					outcome = { status: 'complete' };
				} else if (isPasswordRecoveryLinkError(result.userError)) {
					outcome = { status: 'error', userError: result.userError };
				}
				return result;
			} catch (cause) {
				return foldSignInError(cause);
			}
		});

	const current = $derived.by((): CompletePasswordRecoveryState => {
		if (outcome !== undefined) {
			return outcome;
		}
		if (browserSecret === null) {
			return { status: 'error', userError: { error: 'MISSING_SECRET' } };
		}
		if (check.error !== undefined) {
			return { status: 'error', userError: { error: 'OTHER_ERROR', cause: check.error } };
		}
		if (browserSecret === undefined || check.data === undefined) {
			return { status: 'loading' };
		}
		if (!check.data.success && !tracker.pending) {
			return { status: 'error', userError: check.data.userError };
		}
		return { status: 'ready', completePasswordRecovery, pending: tracker.pending };
	});

	return {
		get current() {
			return current;
		}
	};
}

//------------------------------------------------------------------------------
// Email change
//------------------------------------------------------------------------------

/**
 * Start changing the email of the signed-in user. On success, the backend
 * emails a link to the new address, and the page that link opens calls
 * {@link useCompleteChangeEmail}.
 */
export function useStartChangeEmail(api: { startChangeEmail: StartChangeEmailMutation }) {
	const { mutation, storage } = getConvexAuthContext('useStartChangeEmail()');
	const tracker = createPending();
	return {
		/** Start the change. Resolves to a result, never rejects. */
		startChangeEmail: (args: {
			newEmail: string;
			currentPassword: string;
		}): Promise<StartChangeEmailResult> =>
			tracker.track(async () => {
				try {
					const result = await mutation(api.startChangeEmail, args);
					if (result.success) {
						await storage.set(SECRET_STORAGE_KEYS.changeEmail, result.browserSecret);
						return { success: true };
					}
					return result;
				} catch (cause) {
					return foldError(cause);
				}
			}),
		/** `true` while the change is being started. */
		get pending() {
			return tracker.pending;
		}
	};
}

/**
 * Finish an email change from the link in the email. Runs on its own once
 * the session has loaded; render from `current`.
 *
 * @param options.emailCode The code from the link.
 */
export function useCompleteChangeEmail(
	api: { completeChangeEmail: CompleteChangeEmailMutation },
	{ emailCode }: { emailCode: string }
): { readonly current: CompleteChangeEmailState } {
	const context = getConvexAuthContext('useCompleteChangeEmail()');
	return linkFlow<ExtractError<CompleteChangeEmailResult>>(
		context,
		'changeEmail',
		async (browserSecret) => {
			const result = await context.mutation(api.completeChangeEmail, { emailCode, browserSecret });
			if (result.success) {
				return { done: true } as const;
			}
			return { done: false, userError: result.userError } as const;
		}
	);
}
