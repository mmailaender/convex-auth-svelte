/**
 * The modal flows of the `usernamePasskey` method: the identifier-first
 * sign-in, and adding and removing a passkey of the signed-in user.
 *
 * Adapted from `@convex-dev/auth` v2
 * (`src/methods/username-passkey/flows.ts` and
 * `src/methods/username-passkey/management/flows.ts`), Copyright Convex,
 * Inc., licensed under the Apache License 2.0. Upstream doesn't export them.
 * The flows are the same; they take the mutation runners of this package's
 * context instead of a `ConvexReactClient`.
 *
 * @module
 */
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import type { AuthSignInApi, SlimTokenBundle, TokenBundle } from '../types.js';
import type { ClientView } from '../../methods/shared.js';
import type {
	PasskeyClientError,
	PasskeyClientFailure,
	ResolvedPasskeyCeremonies
} from './ceremonies.js';
import type {
	AddPasskeyApi,
	FinishAddPasskeyResult,
	FinishRemovePasskeyResult,
	FinishSignInResult,
	FinishSignUpResult,
	RemovePasskeyApi,
	SignInError,
	StartAddPasskeyResult,
	StartRemovePasskeyResult,
	StartSignInResult,
	UsernamePasskeyApi,
	VerifyAddPasskeyResult
} from './types.js';

/** Runs a public mutation on the Convex client. */
type MutationRunner = <F extends FunctionReference<'mutation', 'public'>>(
	fn: F,
	args: FunctionArgs<F>
) => Promise<FunctionReturnType<F>>;

/** What the sign-in flow needs. */
export type SignInFlowContext = {
	/** Runs the start mutations, which mint no session. */
	mutation: MutationRunner;
	api: UsernamePasskeyApi;
	/**
	 * Runs the finish mutations, which mint a session, so they work under
	 * both session models (SPA and SvelteKit).
	 */
	signInApi: AuthSignInApi;
	/** Adopts a minted session. */
	setSession: (session: TokenBundle | SlimTokenBundle) => Promise<void>;
	ceremonies: ResolvedPasskeyCeremonies;
};

/**
 * The user-facing failures of the ceremony protocol. The start mutation and
 * the ceremonies answer with their own `success` boolean, which this flow
 * re-wraps as error arms, so callers only see the one `status` discriminant.
 */
type ProtocolUserError =
	| Extract<StartSignInResult, { success: false }>['userError']
	| PasskeyClientError;

/**
 * The result of {@link runSignInOrSignUpFlow}. A completed sign-in carries a
 * `flow` discriminant: `"signUp"` when the ceremony created a new account,
 * `"signIn"` when it authenticated an existing one.
 */
export type SignInFlowResult =
	| (Extract<ClientView<FinishSignUpResult>, { status: 'complete' }> & { flow: 'signUp' })
	| (Extract<ClientView<FinishSignInResult>, { status: 'complete' }> & { flow: 'signIn' })
	| Extract<ClientView<FinishSignUpResult>, { status: 'error' }>
	| Extract<ClientView<FinishSignInResult>, { status: 'error' }>
	| SignInError<ProtocolUserError>;

/** The errors the autofill sign-in reports. */
export type UsernamePasskeyAutofillError =
	| Extract<FinishSignInResult, { status: 'error' }>['userError']
	| PasskeyClientError;

/**
 * The identifier-first sign-in flow: the start mutation tells whether the
 * username is new, then one ceremony makes a passkey or uses one.
 */
export async function runSignInOrSignUpFlow(
	ctx: SignInFlowContext,
	{ username }: { username: string }
): Promise<SignInFlowResult> {
	const { mutation, api, signInApi, setSession, ceremonies } = ctx;

	if (!ceremonies.isSupported()) {
		return { status: 'error', userError: { error: 'WEBAUTHN_UNSUPPORTED' } };
	}

	const start = await mutation(api.startSignInWithUsernamePasskey, { username });
	if (!start.success) {
		return { status: 'error', userError: start.userError };
	}

	if (start.step === 'register') {
		const ceremony = await ceremonies.register(start.options);
		if (!ceremony.success) {
			return { status: 'error', userError: ceremony.userError };
		}
		const result = await signInApi.mutation(api.finishSignUpWithUsernamePasskey, {
			username,
			response: ceremony.response
		});
		if (result.status !== 'complete') {
			return result;
		}
		await setSession(result.tokens);
		return { ...result, flow: 'signUp' };
	}

	const ceremony = await ceremonies.authenticate(start.options);
	if (!ceremony.success) {
		return { status: 'error', userError: ceremony.userError };
	}
	const result = await signInApi.mutation(api.finishSignInWithUsernamePasskey, {
		response: ceremony.response
	});
	if (result.status !== 'complete') {
		return result;
	}
	await setSession(result.tokens);
	return { ...result, flow: 'signIn' };
}

/** What the management flows need. */
export type ManagementFlowContext<Api> = {
	/** Runs the management mutations as the signed-in user. */
	mutation: MutationRunner;
	api: Api;
	ceremonies: ResolvedPasskeyCeremonies;
};

export type AddPasskeyFlowResult =
	| FinishAddPasskeyResult
	| Extract<StartAddPasskeyResult, { success: false }>
	| Extract<VerifyAddPasskeyResult, { success: false }>
	| PasskeyClientFailure;

export type RemovePasskeyFlowResult =
	| FinishRemovePasskeyResult
	| Extract<StartRemovePasskeyResult, { success: false }>
	| PasskeyClientFailure;

/**
 * Add a passkey to the account of the signed-in user. The user first
 * authenticates with an existing passkey to prove their identity, then
 * registers the new one.
 */
export async function runAddPasskeyFlow(
	ctx: ManagementFlowContext<AddPasskeyApi>
): Promise<AddPasskeyFlowResult> {
	const { mutation, api, ceremonies } = ctx;

	if (!ceremonies.isSupported()) {
		return { success: false, userError: { error: 'WEBAUTHN_UNSUPPORTED' } };
	}

	const start = await mutation(api.startAddPasskey, {});
	if (!start.success) {
		return start;
	}
	const assertion = await ceremonies.authenticate(start.options);
	if (!assertion.success) {
		return assertion;
	}
	const verified = await mutation(api.verifyAddPasskey, { response: assertion.response });
	if (!verified.success) {
		return verified;
	}
	const registration = await ceremonies.register(verified.options);
	if (!registration.success) {
		return registration;
	}
	return await mutation(api.finishAddPasskey, { response: registration.response });
}

/**
 * Remove a passkey from the account of the signed-in user. A different
 * passkey of the account must authorize the removal.
 */
export async function runRemovePasskeyFlow(
	ctx: ManagementFlowContext<RemovePasskeyApi>,
	{ passkeyId }: { passkeyId: string }
): Promise<RemovePasskeyFlowResult> {
	const { mutation, api, ceremonies } = ctx;

	if (!ceremonies.isSupported()) {
		return { success: false, userError: { error: 'WEBAUTHN_UNSUPPORTED' } };
	}

	const start = await mutation(api.startRemovePasskey, { passkeyId });
	if (!start.success) {
		return start;
	}
	const assertion = await ceremonies.authenticate(start.options);
	if (!assertion.success) {
		return assertion;
	}
	return await mutation(api.finishRemovePasskey, { passkeyId, response: assertion.response });
}
