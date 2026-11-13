/**
 * Svelte client for the GitHub sign-in method of Convex Auth v2. The
 * counterpart of `@convex-dev/auth/methods/github/react`.
 *
 * {@link useSignInWithGithub} starts the sign-in. {@link useOauth} returns the
 * state shared by all the OAuth methods, like the error of the last flow.
 *
 * Under SvelteKit, add `api.auth.completeSignInWithGithub` to the `signIn`
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

/** What {@link useSignInWithGithub} returns. */
export type UseSignInWithGithubReturn = {
	/** Start GitHub's OAuth flow. See {@link UseOauthSignInReturn.signIn}. */
	signIn: UseOauthSignInReturn['signIn'];
};

/**
 * Sign in with GitHub. Call during component initialization. Pass the module
 * exporting the functions of the method (usually `api.auth`), or an object
 * mapping the canonical keys to renamed exports.
 *
 * ```svelte
 * <script lang="ts">
 *   import { useSignInWithGithub, useOauth } from '@mmailaender/convex-auth-svelte/methods/github';
 *   import { api } from '$convex/_generated/api';
 *
 *   const github = useSignInWithGithub(api.auth);
 *   const oauth = useOauth();
 * </script>
 *
 * <button onclick={() => github.signIn()}>Continue with GitHub</button>
 * {#if oauth.flowError}<p role="alert">Sign-in failed: {oauth.flowError.error}</p>{/if}
 * ```
 */
export function useSignInWithGithub(api: {
	startSignInWithGithub: OauthProviderApi['startSignIn'];
	completeSignInWithGithub: OauthProviderApi['completeSignIn'];
}): UseSignInWithGithubReturn {
	return useOauthSignIn('useSignInWithGithub()', {
		providerName: 'github',
		startSignIn: api.startSignInWithGithub,
		completeSignIn: api.completeSignInWithGithub
	});
}
