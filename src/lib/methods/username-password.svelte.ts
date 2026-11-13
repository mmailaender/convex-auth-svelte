/**
 * Svelte client for the `usernamePassword` method of Convex Auth v2. The
 * counterpart of `@convex-dev/auth/methods/username-password/react`.
 *
 * Each helper returns a function that sends the credentials and, on success,
 * adopts the session, plus a `pending` flag. Read `pending` from the returned
 * object (don't destructure it), so it stays reactive.
 *
 * @module
 */
import type { FunctionReference } from 'convex/server';
import type {
	SignInResult as SignInMutationResult,
	SignUpResult as SignUpMutationResult
} from '@convex-dev/auth/methods/username-password/server';
import { getConvexAuthContext } from '../internal/core.svelte.js';
import type { ClientView } from './shared.js';

export { DEFAULT_MIN_PASSWORD_LENGTH } from '@convex-dev/auth/methods/username-password';

/** The `(username, password)` pair both flows accept. */
export type Credentials = { username: string; password: string };

type UnexpectedFailure = {
	status: 'error';
	userError: { error: 'OTHER_ERROR'; cause: unknown };
};

/** What `signIn` resolves to. Switch on `status`, then on `userError.error`. */
export type SignInWithUsernamePasswordResult = ClientView<SignInMutationResult> | UnexpectedFailure;

/** What `signUp` resolves to. Switch on `status`, then on `userError.error`. */
export type SignUpWithUsernamePasswordResult = ClientView<SignUpMutationResult> | UnexpectedFailure;

function passwordFlow<Result extends ClientView<SignInMutationResult | SignUpMutationResult>>(
	caller: string,
	mutation: FunctionReference<'mutation', 'public', Credentials, Result>
) {
	const { authClient, signInApi } = getConvexAuthContext(caller);
	let inFlight = $state(0);
	const run = async (credentials: Credentials): Promise<Result | UnexpectedFailure> => {
		inFlight++;
		try {
			const result = await signInApi.mutation(mutation, credentials);
			if (result.status === 'complete') {
				await authClient.setSession(result.tokens);
			}
			return result;
		} catch (cause) {
			// The mutation threw instead of resolving to a `userError`. Folded into
			// the result so callers handle every failure in one switch.
			return { status: 'error', userError: { error: 'OTHER_ERROR', cause } };
		} finally {
			inFlight--;
		}
	};
	return {
		run,
		get pending() {
			return inFlight > 0;
		}
	};
}

/**
 * Sign in to an existing account. Call during component initialization.
 *
 * ```svelte
 * <script lang="ts">
 *   import { useSignInWithUsernamePassword } from '@mmailaender/convex-auth-svelte/methods/username-password';
 *   import { api } from '$convex/_generated/api';
 *
 *   const login = useSignInWithUsernamePassword(api.auth);
 *   let username = $state('');
 *   let password = $state('');
 *   let error = $state<string | null>(null);
 *
 *   async function onsubmit(event: SubmitEvent) {
 *     event.preventDefault();
 *     const result = await login.signIn({ username, password });
 *     if (result.status === 'error') error = result.userError.error;
 *   }
 * </script>
 *
 * <form {onsubmit}>
 *   <input id="username" autocomplete="username" bind:value={username} disabled={login.pending} />
 *   <input id="password" type="password" autocomplete="current-password" bind:value={password} disabled={login.pending} />
 *   <button disabled={login.pending}>Sign in</button>
 * </form>
 * ```
 *
 * @param api The functions of the method, usually `api.auth`.
 */
export function useSignInWithUsernamePassword(api: {
	signInWithUsernamePassword: FunctionReference<
		'mutation',
		'public',
		Credentials,
		ClientView<SignInMutationResult>
	>;
}) {
	const flow = passwordFlow('useSignInWithUsernamePassword()', api.signInWithUsernamePassword);
	return {
		/** Sign in with the credentials. Resolves to a result, never rejects. */
		signIn: flow.run,
		/** `true` while the credentials are being validated. */
		get pending() {
			return flow.pending;
		}
	};
}

/**
 * Create an account and sign in to it. Call during component
 * initialization. Same shape as {@link useSignInWithUsernamePassword}.
 *
 * @param api The functions of the method, usually `api.auth`.
 */
export function useSignUpWithUsernamePassword(api: {
	signUpWithUsernamePassword: FunctionReference<
		'mutation',
		'public',
		Credentials,
		ClientView<SignUpMutationResult>
	>;
}) {
	const flow = passwordFlow('useSignUpWithUsernamePassword()', api.signUpWithUsernamePassword);
	return {
		/** Sign up with the credentials. Resolves to a result, never rejects. */
		signUp: flow.run,
		/** `true` while the credentials are being validated. */
		get pending() {
			return flow.pending;
		}
	};
}
