/**
 * Svelte client for the Google sign-in method of Convex Auth v2. The
 * counterpart of `@convex-dev/auth/methods/google/react`.
 *
 * {@link useSignInWithGoogle} starts the sign-in. {@link useOauth} returns the
 * state shared by all the OAuth methods, like the error of the last flow.
 *
 * Under SvelteKit, add `api.auth.completeSignInWithGoogle` to the `signIn`
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

/** What {@link useSignInWithGoogle} returns. */
export type UseSignInWithGoogleReturn = {
	/** Start Google's OAuth flow. See {@link UseOauthSignInReturn.signIn}. */
	signIn: UseOauthSignInReturn['signIn'];
};

/**
 * Sign in with Google. Call during component initialization. Pass the module
 * exporting the functions of the method (usually `api.auth`), or an object
 * mapping the canonical keys to renamed exports.
 *
 * ```svelte
 * <script lang="ts">
 *   import { useSignInWithGoogle, useOauth } from '@mmailaender/convex-auth-svelte/methods/google';
 *   import { api } from '$convex/_generated/api';
 *
 *   const google = useSignInWithGoogle(api.auth);
 *   const oauth = useOauth();
 * </script>
 *
 * <button onclick={() => google.signIn()}>Continue with Google</button>
 * {#if oauth.flowError}<p role="alert">Sign-in failed: {oauth.flowError.error}</p>{/if}
 * ```
 */
export function useSignInWithGoogle(api: {
	startSignInWithGoogle: OauthProviderApi['startSignIn'];
	completeSignInWithGoogle: OauthProviderApi['completeSignIn'];
}): UseSignInWithGoogleReturn {
	return useOauthSignIn('useSignInWithGoogle()', {
		providerName: 'google',
		startSignIn: api.startSignInWithGoogle,
		completeSignIn: api.completeSignInWithGoogle
	});
}
