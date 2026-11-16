/**
 * Framework-agnostic client for the OAuth sign-in methods (Google, GitHub,
 * Apple).
 *
 * Adapted from `@convex-dev/auth` v2 (`src/methods/oauth/client.ts`),
 * Copyright Convex, Inc., licensed under the Apache License 2.0. Upstream only
 * exports it from `@convex-dev/auth/methods/oauth/react`, which imports React,
 * so it is carried here. The flow, the storage format and the URL params
 * match upstream, so it interoperates with the `startSignIn*` /
 * `completeSignIn*` functions of the OAuth components.
 *
 * Sign-in spans a full page round-trip, so this client saves what it needs
 * before navigating away and finishes the flow at startup. The server hands
 * back a `state` when a flow starts and this client keeps it locally, then
 * sends it back with the code from the callback URL. That pairing is what
 * proves this browser started the sign-in.
 *
 * @module
 */
import { getFunctionName, makeFunctionReference, type FunctionReference } from 'convex/server';
import { retryOnNetworkError } from './retry.js';
import type { AmbientSignInClient, AmbientSignInContext, SlimTokenBundle } from './types.js';

/** The query param carrying the one-time code the client redeems for a session. */
const OAUTH_CODE_PARAM = 'convexAuthCode';
/** The query param carrying why the flow failed. */
const OAUTH_ERROR_PARAM = 'convexAuthError';

/** What the `completeSignIn*` mutation of an OAuth method resolves to. */
type CompleteSignInResult =
	| { status: 'complete'; tokens: SlimTokenBundle }
	| { status: 'error'; userError: { error: 'INVALID_CODE' } };

/**
 * The mutations that the method of an OAuth provider adds to the app's API.
 * Passed as references, not names, because an app can re-export them under
 * any name.
 */
export type OauthProviderApi = {
	/** The provider's `startSignIn*` mutation. */
	startSignIn: FunctionReference<
		'mutation',
		'public',
		{ redirectTo: string },
		{ redirect: string; state: string }
	>;
	/** The provider's `completeSignIn*` mutation. */
	completeSignIn: FunctionReference<
		'mutation',
		'public',
		{ code: string; state: string },
		CompleteSignInResult
	>;
};

/** One provider's mutations plus its name. */
export type OauthProviderRefs = {
	/** The provider's name, e.g. `"google"`. Only a label, never a lookup key. */
	providerName: string;
} & OauthProviderApi;

/**
 * Why a flow failed after the identity provider sent the user back.
 *
 * - `"ACCESS_DENIED"`: the user cancelled at the identity provider.
 * - `"EXPIRED"`: the flow took too long, or the code was already redeemed.
 * - `"INVALID_FLOW"`: the callback arrived but this client has no saved flow,
 *   so it never started this sign-in or already finished it.
 * - `"OTHER_ERROR"`: anything else. `cause` is the thrown value, or the error
 *   the callback URL carried.
 */
export type OauthFlowError =
	| { error: 'ACCESS_DENIED' }
	| { error: 'EXPIRED' }
	| { error: 'INVALID_FLOW' }
	| { error: 'OTHER_ERROR'; cause: unknown };

/**
 * What starting a flow resolves to. On the web the client navigates to
 * `redirect` itself.
 */
export type OauthStartResult =
	| { status: 'redirect'; redirect: URL }
	| { status: 'error'; userError: { error: 'OTHER_ERROR'; cause: unknown } };

/** What finishing a saved flow with a callback `code` resolves to. */
export type OauthCompleteResult =
	| { status: 'complete' }
	| { status: 'error'; userError: OauthFlowError };

/** Options of an OAuth `signIn`. */
export type SignInOptions = {
	/**
	 * Where the flow returns to when it finishes. Defaults to the current URL.
	 * Must be an http or https URL that the backend lists in
	 * `allowedRedirectOrigins`.
	 */
	redirectTo?: string;
	/** A callback `code` to finish a saved flow instead of starting a new one. */
	code?: string;
};

/** The sign-in actions {@link oauth} publishes for the method helpers. */
export type OauthActions = {
	signIn: (
		refs: OauthProviderRefs,
		options?: SignInOptions
	) => Promise<OauthStartResult | OauthCompleteResult>;
};

/** The id {@link oauth} registers under. Matches upstream. */
export const OAUTH_SETUP_ID = 'oauth';
/** Key {@link oauth} publishes its {@link OauthActions} under. */
export const OAUTH_ACTIONS_KEY = 'actions';
/** Key holding the current {@link OauthFlowError}, or `null`. */
export const OAUTH_FLOW_ERROR_KEY = 'flowError';

/** Storage key for the saved sign-in flow. */
const OAUTH_FLOW_STORAGE_KEY = 'flow';

/** What `signIn` saves before it navigates to the identity provider. */
type PendingFlow = {
	providerName: string;
	state: string;
	/** The path of the provider's `completeSignIn` mutation. */
	completeSignIn: string;
};

type SignInStorage = AmbientSignInContext['storage'];

function callbackFlowError(param: string): OauthFlowError {
	switch (param) {
		case 'access_denied':
			return { error: 'ACCESS_DENIED' };
		case 'expired':
			return { error: 'EXPIRED' };
		default:
			return { error: 'OTHER_ERROR', cause: param };
	}
}

function currentHref(): string | null {
	if (typeof window === 'undefined' || window.location === undefined) {
		return null;
	}
	return window.location.href;
}

/**
 * Read and remove the saved sign-in flow. It is removed even if the redeem
 * that follows fails, because the code it pairs with is one-time.
 */
async function takePendingFlow(storage: SignInStorage): Promise<PendingFlow | null> {
	const raw = await storage.get(OAUTH_FLOW_STORAGE_KEY);
	await storage.remove(OAUTH_FLOW_STORAGE_KEY);
	if (raw === null || raw === undefined) {
		return null;
	}
	try {
		const parsed = JSON.parse(raw) as Partial<Record<keyof PendingFlow, unknown>>;
		if (
			typeof parsed.providerName !== 'string' ||
			typeof parsed.state !== 'string' ||
			typeof parsed.completeSignIn !== 'string'
		) {
			return null;
		}
		return {
			providerName: parsed.providerName,
			state: parsed.state,
			completeSignIn: parsed.completeSignIn
		};
	} catch {
		return null;
	}
}

async function dropPendingFlow(storage: SignInStorage): Promise<void> {
	try {
		await storage.remove(OAUTH_FLOW_STORAGE_KEY);
	} catch {
		// The flow was already over.
	}
}

/**
 * Client setup for the OAuth providers. It owns the flow's storage and the
 * startup work that finishes a flow. `setupConvexAuth` registers it by
 * default; include it yourself if you pass `ambientSignIns`.
 */
export function oauth(): AmbientSignInClient {
	const setup: AmbientSignInClient['setup'] = ({
		client,
		values,
		storage,
		signInApi,
		convex,
		replaceUrl
	}) => {
		const setFlowError = (flowError: OauthFlowError | null): void => {
			values.set(OAUTH_FLOW_ERROR_KEY, flowError);
		};

		/** Redeem a callback `code` against the saved flow. Never rejects. */
		const redeem = async (code: string): Promise<OauthCompleteResult> => {
			try {
				const pending = await takePendingFlow(storage);
				if (pending === null) {
					return { status: 'error', userError: { error: 'INVALID_FLOW' } };
				}
				const completeSignIn = makeFunctionReference<'mutation'>(
					pending.completeSignIn
				) as OauthProviderApi['completeSignIn'];
				const result = await retryOnNetworkError(() =>
					signInApi.mutation(completeSignIn, { code, state: pending.state })
				);
				if (result.status === 'error') {
					return { status: 'error', userError: { error: 'EXPIRED' } };
				}
				await client.setSession(result.tokens);
				return { status: 'complete' };
			} catch (error) {
				return { status: 'error', userError: { error: 'OTHER_ERROR', cause: error } };
			}
		};

		/**
		 * Finish a flow the callback redirected back to. The params are read and
		 * stripped from the URL before the first await, so a second run sees a
		 * clean URL and does nothing.
		 */
		const handleCallback = (): void => {
			const href = currentHref();
			if (href === null) {
				return;
			}
			const url = new URL(href);
			const code = url.searchParams.get(OAUTH_CODE_PARAM);
			const errorParam = url.searchParams.get(OAUTH_ERROR_PARAM);
			if (code === null && errorParam === null) {
				return;
			}
			url.searchParams.delete(OAUTH_CODE_PARAM);
			url.searchParams.delete(OAUTH_ERROR_PARAM);
			replaceUrl(url.toString());
			if (errorParam !== null) {
				void dropPendingFlow(storage);
				setFlowError(callbackFlowError(errorParam));
				return;
			}
			if (code === null) {
				return;
			}
			void client.withSignInPending(async () => {
				const result = await redeem(code);
				if (result.status === 'error') {
					setFlowError(result.userError);
				}
			});
		};

		const signIn: OauthActions['signIn'] = async (refs, options) => {
			const code = options?.code;
			if (code !== undefined) {
				setFlowError(null);
				return await client.withSignInPending(() => redeem(code));
			}
			const href = currentHref();
			const redirectTo = options?.redirectTo ?? href;
			if (redirectTo === null) {
				throw new Error('`redirectTo` is required where there is no current page URL.');
			}
			setFlowError(null);
			try {
				const { redirect, state } = await convex.mutation(refs.startSignIn, { redirectTo });
				await storage.set(
					OAUTH_FLOW_STORAGE_KEY,
					JSON.stringify({
						providerName: refs.providerName,
						state,
						completeSignIn: getFunctionName(refs.completeSignIn)
					} satisfies PendingFlow)
				);
				const url = new URL(redirect);
				if (href !== null) {
					window.location.href = url.toString();
				}
				return { status: 'redirect', redirect: url };
			} catch (cause) {
				return { status: 'error', userError: { error: 'OTHER_ERROR', cause } };
			}
		};

		values.set(OAUTH_ACTIONS_KEY, { signIn } satisfies OauthActions);
		setFlowError(null);
		return { onInit: handleCallback };
	};
	return { id: OAUTH_SETUP_ID, setup };
}
