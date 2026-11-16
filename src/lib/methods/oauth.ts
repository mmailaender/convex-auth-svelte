/**
 * Svelte client for the OAuth state that is shared by the Google, GitHub and
 * Apple methods. The counterpart of `@convex-dev/auth/methods/oauth/react`.
 *
 * `setupConvexAuth` registers {@link oauth} by default, which finishes a flow
 * when the identity provider redirects back to the app. If you pass its
 * `ambientSignIns` option, include `oauth()` yourself.
 *
 * Under SvelteKit, add each provider's `completeSignIn*` function to the
 * `signIn` list of `setupConvexAuthServer`. Its `startSignIn*` function runs on
 * the Convex client and is not listed.
 *
 * @module
 */
import { createSubscriber } from 'svelte/reactivity';
import { getConvexAuthContext } from '../internal/core.svelte.js';
import {
	OAUTH_ACTIONS_KEY,
	OAUTH_FLOW_ERROR_KEY,
	OAUTH_SETUP_ID,
	type OauthActions,
	type OauthCompleteResult,
	type OauthFlowError,
	type OauthProviderRefs,
	type OauthStartResult,
	type SignInOptions
} from '../internal/oauthClient.js';

export { oauth } from '../internal/oauthClient.js';
export type {
	OauthCompleteResult,
	OauthFlowError,
	OauthProviderApi,
	OauthProviderRefs,
	OauthStartResult,
	SignInOptions
} from '../internal/oauthClient.js';

const NOT_REGISTERED_ERROR =
	'No OAuth setup is registered. setupConvexAuth registers oauth() by default, ' +
	'so include it yourself if you set the `ambientSignIns` option.';

/** What {@link useOauth} returns. */
export type UseOauthReturn = {
	/**
	 * Why the last flow failed after the redirect back, or `null`. Cleared on
	 * the next sign-in. Switch on its `error` and supply the text for each code.
	 */
	readonly flowError: OauthFlowError | null;
};

/**
 * Read the OAuth state that isn't tied to one provider. A flow completes on
 * whichever page it redirects back to, so `flowError` can appear on a page
 * that never started a sign-in. Call during component initialization, and
 * read `flowError` from the returned object.
 */
export function useOauth(): UseOauthReturn {
	const { authClient } = getConvexAuthContext('useOauth()');
	const values = authClient.ambientSignInValues(OAUTH_SETUP_ID);
	if (values.get(OAUTH_FLOW_ERROR_KEY) === undefined) {
		throw new Error(NOT_REGISTERED_ERROR);
	}
	const subscribe = createSubscriber((update) => values.subscribe(OAUTH_FLOW_ERROR_KEY, update));
	return {
		get flowError() {
			subscribe();
			return values.get<OauthFlowError | null>(OAUTH_FLOW_ERROR_KEY) ?? null;
		}
	};
}

/** What the sign-in helpers of the OAuth providers return. */
export type UseOauthSignInReturn = {
	/**
	 * Start the provider's OAuth flow, which navigates away to the identity
	 * provider. With `options.code`, finish a flow started elsewhere instead.
	 *
	 * A failure to start comes back in the result. Failures after the redirect
	 * back show up in {@link useOauth}'s `flowError`.
	 */
	signIn: {
		(options: SignInOptions & { code: string }): Promise<OauthCompleteResult>;
		(options?: Omit<SignInOptions, 'code'> & { code?: undefined }): Promise<OauthStartResult>;
	};
};

/**
 * Run one OAuth provider's sign-in flow from its function references.
 *
 * @internal The per-provider helpers like `useSignInWithGoogle` call this.
 */
export function useOauthSignIn(caller: string, refs: OauthProviderRefs): UseOauthSignInReturn {
	const { authClient } = getConvexAuthContext(caller);
	const actions = authClient
		.ambientSignInValues(OAUTH_SETUP_ID)
		.get<OauthActions>(OAUTH_ACTIONS_KEY);
	if (actions === undefined) {
		throw new Error(NOT_REGISTERED_ERROR);
	}
	const signIn = ((options?: SignInOptions) =>
		actions.signIn(refs, options)) as UseOauthSignInReturn['signIn'];
	return { signIn };
}
