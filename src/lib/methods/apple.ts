/**
 * Svelte client for the Apple sign-in method of Convex Auth v2. The
 * counterpart of `@convex-dev/auth/methods/apple/react`.
 *
 * {@link useSignInWithApple} starts the sign-in. {@link useOauth} returns the
 * state shared by all the OAuth methods, like the error of the last flow.
 *
 * Under SvelteKit, add `api.auth.completeSignInWithApple` to the `signIn`
 * list of `createConvexAuthHooks`.
 *
 * @module
 */
import { useOauthSignIn, type UseOauthSignInReturn } from './oauth.js';
import type { OauthProviderApi } from '../internal/oauthClient.js';

export { useOauth, type UseOauthReturn } from './oauth.js';
export type {
	OauthCompleteResult,
	OauthFlowError,
	OauthStartResult,
	SignInOptions
} from '../internal/oauthClient.js';

/** What {@link useSignInWithApple} returns. */
export type UseSignInWithAppleReturn = {
	/** Start Apple's OAuth flow. See {@link UseOauthSignInReturn.signIn}. */
	signIn: UseOauthSignInReturn['signIn'];
};

/**
 * Sign in with Apple. Call during component initialization. Pass the module
 * exporting the functions of the method (usually `api.auth`), or an object
 * mapping the canonical keys to renamed exports.
 *
 * ```svelte
 * <script lang="ts">
 *   import { useSignInWithApple, useOauth } from '@mmailaender/convex-auth-svelte/methods/apple';
 *   import { api } from '$convex/_generated/api';
 *
 *   const apple = useSignInWithApple(api.auth);
 *   const oauth = useOauth();
 * </script>
 *
 * <button onclick={() => apple.signIn()}>Continue with Apple</button>
 * {#if oauth.flowError}<p role="alert">Sign-in failed: {oauth.flowError.error}</p>{/if}
 * ```
 */
export function useSignInWithApple(api: {
	startSignInWithApple: OauthProviderApi['startSignIn'];
	completeSignInWithApple: OauthProviderApi['completeSignIn'];
}): UseSignInWithAppleReturn {
	return useOauthSignIn('useSignInWithApple()', {
		providerName: 'apple',
		startSignIn: api.startSignInWithApple,
		completeSignIn: api.completeSignInWithApple
	});
}
