/**
 * The wire types of the `usernamePasskey` method: the WebAuthn options its
 * start mutations return, the responses its finish mutations take, and the
 * results of every function it exports.
 *
 * `@convex-dev/auth` declares them in internal modules (the passkey
 * component's `validation.ts`, the management modules), and exports most of
 * them only from `@convex-dev/auth/methods/username-passkey/react`, whose
 * types import React. They are derived here from the functions that
 * `setupUsernamePasskey` returns, so they always match the installed
 * `@convex-dev/auth`.
 *
 * @module
 */
import type {
	ApiFromModules,
	FunctionArgs,
	FunctionReference,
	FunctionReturnType
} from 'convex/server';
import type {
	FinishSignInResult,
	FinishSignUpResult,
	StartAutofillSignInResult,
	StartSignInResult,
	setupUsernamePasskey
} from '@convex-dev/auth/methods/username-passkey/server';
import type { ClientView } from '../../methods/shared.js';

export type {
	FinishSignInResult,
	FinishSignUpResult,
	StartAutofillSignInResult,
	StartSignInResult
};

/** The public functions of the method, as references. */
type MethodApi = ApiFromModules<{
	auth: ReturnType<ReturnType<typeof setupUsernamePasskey>['attachUserCallbacks']>;
}>['auth'];

type ResultOf<Name extends keyof MethodApi> = FunctionReturnType<MethodApi[Name]>;

/** The options of an authentication ceremony (`navigator.credentials.get()`). */
export type WireRequestOptions = Extract<StartSignInResult, { step: 'authenticate' }>['options'];

/** The options of a registration ceremony (`navigator.credentials.create()`). */
export type WireCreationOptions = Extract<StartSignInResult, { step: 'register' }>['options'];

/** An authentication response, in the exact shape the finish mutations take. */
export type WireAuthenticationResponse = FunctionArgs<
	MethodApi['finishSignInWithUsernamePasskey']
>['response'];

/** A registration response, in the exact shape the finish mutations take. */
export type WireRegistrationResponse = FunctionArgs<
	MethodApi['finishSignUpWithUsernamePasskey']
>['response'];

export type ListPasskeysResult = ResultOf<'listPasskeys'>;
export type RenamePasskeyResult = ResultOf<'renamePasskey'>;
export type StartAddPasskeyResult = ResultOf<'startAddPasskey'>;
export type VerifyAddPasskeyResult = ResultOf<'verifyAddPasskey'>;
export type FinishAddPasskeyResult = ResultOf<'finishAddPasskey'>;
export type StartRemovePasskeyResult = ResultOf<'startRemovePasskey'>;
export type FinishRemovePasskeyResult = ResultOf<'finishRemovePasskey'>;

/** The mutation references the sign-in flows drive. */
export type UsernamePasskeyApi = {
	startSignInWithUsernamePasskey: FunctionReference<
		'mutation',
		'public',
		{ username: string },
		StartSignInResult
	>;
	startAutofillSignInWithUsernamePasskey: FunctionReference<
		'mutation',
		'public',
		Record<string, never>,
		StartAutofillSignInResult
	>;
	finishSignInWithUsernamePasskey: FunctionReference<
		'mutation',
		'public',
		{ response: WireAuthenticationResponse },
		ClientView<FinishSignInResult>
	>;
	finishSignUpWithUsernamePasskey: FunctionReference<
		'mutation',
		'public',
		{ username: string; response: WireRegistrationResponse },
		ClientView<FinishSignUpResult>
	>;
};

/** The mutation references that adding a passkey drives. */
export type AddPasskeyApi = {
	startAddPasskey: FunctionReference<
		'mutation',
		'public',
		Record<string, never>,
		StartAddPasskeyResult
	>;
	verifyAddPasskey: FunctionReference<
		'mutation',
		'public',
		{ response: WireAuthenticationResponse },
		VerifyAddPasskeyResult
	>;
	finishAddPasskey: FunctionReference<
		'mutation',
		'public',
		{ response: WireRegistrationResponse },
		FinishAddPasskeyResult
	>;
};

/** The mutation references that removing a passkey drives. */
export type RemovePasskeyApi = {
	startRemovePasskey: FunctionReference<
		'mutation',
		'public',
		{ passkeyId: string },
		StartRemovePasskeyResult
	>;
	finishRemovePasskey: FunctionReference<
		'mutation',
		'public',
		{ passkeyId: string; response: WireAuthenticationResponse },
		FinishRemovePasskeyResult
	>;
};

/** A failed sign-in, in the envelope of the sign-in functions. */
export type SignInError<UserError> = { status: 'error'; userError: UserError };
