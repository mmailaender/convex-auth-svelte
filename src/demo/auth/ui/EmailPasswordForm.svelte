<!--
	Email + password: sign in, create an account (validated through an emailed
	link), and request a password reset link.
-->
<script lang="ts">
	import { strengthChecked } from '$demo/primitives/utils/passwordStrength.js';
	import { useHydrated } from '$demo/primitives/hooks/hydrated.svelte.js';
	import {
		useSignInWithEmailPassword,
		useSignUpWithEmailPassword,
		useStartPasswordRecovery
	} from '$lib/methods/email-password.svelte';
	import { api } from '$lib/convex/_generated/api';
	import * as Password from '$demo/primitives/ui/password/index.js';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import CheckInbox from './CheckInbox.svelte';
	import { authErrorMessage } from '../errors.js';

	let {
		mode = $bindable('signIn'),
		view = $bindable('form'),
		onsuccess
	}: {
		mode?: 'signIn' | 'signUp';
		/** The step the form shows: the form itself, the reset request, or a sent link. */
		view?: 'form' | 'forgot' | 'validation-sent' | 'recovery-sent';
		/** Called once the user is signed in. */
		onsuccess?: () => void;
	} = $props();

	const hydrated = useHydrated();
	const signInFlow = useSignInWithEmailPassword(api.auth);
	const signUpFlow = useSignUpWithEmailPassword(api.auth);
	const recoveryFlow = useStartPasswordRecovery(api.auth);

	let email = $state('');
	let password = $state('');
	let sentTo = $state('');
	let error = $state<string | null>(null);

	const pending = $derived(signInFlow.pending || signUpFlow.pending || recoveryFlow.pending);

	$effect(() => {
		// Switching between sign-in and sign-up starts over.
		void mode;
		view = 'form';
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
		if (mode === 'signIn') {
			const result = await signInFlow.signIn({ email, password });
			if (result.status === 'complete') return onsuccess?.();
			error = authErrorMessage(result.userError, {
				INVALID_CREDENTIALS: 'Incorrect email or password.',
				USER_NOT_FOUND:
					"No account uses this email address, or it isn't validated yet. Open the link we emailed you to validate it."
			});
		} else {
			const result = await signUpFlow.signUp({ email, password });
			if (result.success) {
				sentTo = email;
				password = '';
				view = 'validation-sent';
				return;
			}
			error = authErrorMessage(result.userError);
		}
	}

	async function requestReset(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const result = await recoveryFlow.startPasswordRecovery({ email });
		if (result.success) {
			sentTo = result.sentTo;
			view = 'recovery-sent';
			return;
		}
		error = authErrorMessage(result.userError);
	}

	function backToForm() {
		view = 'form';
		error = null;
	}
</script>

{#if view === 'validation-sent'}
	<CheckInbox
		email={sentTo}
		title="Validate your email"
		message="Open it to finish creating your account. You'll be signed in right away."
		onback={() => {
			mode = 'signIn';
			backToForm();
		}}
	/>
{:else if view === 'recovery-sent'}
	<CheckInbox
		email={sentTo}
		title="Reset your password"
		message="Open it to choose a new password."
		onback={backToForm}
	/>
{:else if view === 'forgot'}
	<form class="flex flex-col gap-5" onsubmit={requestReset}>
		<p class="text-surface-700-300 text-sm">
			Enter the email address of your account, and we'll email you a link to reset your password.
		</p>
		<label class="flex flex-col">
			<span class="label">Email</span>
			<input
				class="input"
				type="email"
				name="email"
				autocomplete="username"
				required
				bind:value={email}
				disabled={pending}
			/>
		</label>
		{#if error}<Alert>{error}</Alert>{/if}
		<div class="flex flex-col gap-2">
			<button
				type="submit"
				class="btn preset-filled-primary-500 w-full"
				disabled={!hydrated.current || pending || checking}
			>
				{#if recoveryFlow.pending}<Spinner />{/if}
				Send reset link
			</button>
			<button type="button" class="btn preset-tonal w-full" onclick={backToForm}>Back</button>
		</div>
	</form>
{:else}
	<form class="flex flex-col gap-5" onsubmit={submit} novalidate>
		<label class="flex flex-col">
			<span class="label">Email</span>
			<!-- "username" rather than "email", so password managers pair it with the password. -->
			<input
				class="input"
				type="email"
				name="email"
				autocomplete="username"
				placeholder="you@example.com"
				required
				bind:value={email}
				disabled={pending}
			/>
		</label>
		<div class="flex flex-col">
			<div class="flex items-baseline justify-between">
				<label class="label" for="email-password">Password</label>
				{#if mode === 'signIn'}
					<button
						type="button"
						class="anchor text-xs whitespace-nowrap"
						onclick={() => {
							view = 'forgot';
							error = null;
						}}
					>
						Forgot password?
					</button>
				{/if}
			</div>
			{#key mode}
				<Password.Root minScore={mode === 'signUp' ? 3 : 0}>
					<Password.Input
						id="email-password"
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
{/if}
