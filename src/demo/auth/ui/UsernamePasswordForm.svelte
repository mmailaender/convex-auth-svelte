<!-- Username + password: sign in, or create an account, which signs in right away. -->
<script lang="ts">
	import { strengthChecked } from '$demo/primitives/utils/passwordStrength.js';
	import { useHydrated } from '$demo/primitives/hooks/hydrated.svelte.js';
	import {
		useSignInWithUsernamePassword,
		useSignUpWithUsernamePassword
	} from '$lib/methods/username-password.svelte';
	import { api } from '$convex/_generated/api';
	import * as Password from '$demo/primitives/ui/password/index.js';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import { authErrorMessage } from '../errors.js';

	let {
		mode = $bindable('signIn'),
		onsuccess
	}: {
		mode?: 'signIn' | 'signUp';
		/** Called once the user is signed in. */
		onsuccess?: () => void;
	} = $props();

	const hydrated = useHydrated();
	const signInFlow = useSignInWithUsernamePassword(api.auth);
	const signUpFlow = useSignUpWithUsernamePassword(api.auth);

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);

	const pending = $derived(signInFlow.pending || signUpFlow.pending);

	$effect(() => {
		void mode;
		error = null;
	});

	let checking = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		// The check can wait for the strength checker to load. A second submit
		// meanwhile would start a second attempt.
		if (checking) return;
		checking = true;
		try {
			await strengthChecked(form);
		} finally {
			checking = false;
		}
		if (!form.checkValidity()) {
			form.querySelector<HTMLElement>(':invalid')?.focus();
			return;
		}
		error = null;
		const credentials = { username, password };
		const result =
			mode === 'signIn'
				? await signInFlow.signIn(credentials)
				: await signUpFlow.signUp(credentials);
		if (result.status === 'complete') return onsuccess?.();
		error = authErrorMessage(result.userError, {
			USER_NOT_FOUND: 'No account uses this username.'
		});
	}
</script>

<form class="flex flex-col gap-5" onsubmit={submit} novalidate>
	<label class="flex flex-col">
		<span class="label">Username</span>
		<input
			class="input"
			name="username"
			autocomplete="username"
			autocapitalize="none"
			spellcheck="false"
			placeholder="ada"
			required
			bind:value={username}
			disabled={pending}
		/>
	</label>
	<div class="flex flex-col">
		<label class="label" for="username-password">Password</label>
		{#key mode}
			<Password.Root minScore={mode === 'signUp' ? 3 : 0}>
				<Password.Input
					id="username-password"
					name="password"
					autocomplete={mode === 'signUp' ? 'new-password' : 'current-password'}
					placeholder={mode === 'signUp' ? 'Create a password' : 'Your password'}
					required
					bind:value={password}
					disabled={pending}
				>
					<Password.ToggleVisibility />
				</Password.Input>
				{#if mode === 'signUp'}
					<Password.Strength />
				{/if}
				<Password.Error />
			</Password.Root>
		{/key}
	</div>
	{#if error}<Alert>{error}</Alert>{/if}
	<button
		type="submit"
		class="btn preset-filled-primary-500 w-full"
		disabled={!hydrated.current || pending || checking}
	>
		{#if pending || checking}<Spinner />{/if}
		{mode === 'signUp' ? 'Create account' : 'Sign in'}
	</button>
</form>
