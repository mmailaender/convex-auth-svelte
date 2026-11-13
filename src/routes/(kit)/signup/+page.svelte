<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from 'convex-svelte';
	import {
		DEFAULT_MIN_PASSWORD_LENGTH,
		useSignUpWithUsernamePassword
	} from '$lib/methods/username-password.svelte';
	import { api } from '$lib/convex/_generated/api';

	const auth = useAuth();
	const signup = useSignUpWithUsernamePassword(api.auth);

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const result = await signup.signUp({ username, password });
		if (result.status === 'complete') {
			await goto('/product');
			return;
		}
		switch (result.userError.error) {
			case 'USERNAME_TAKEN':
				error = 'That username is taken.';
				break;
			case 'PASSWORD_TOO_SHORT':
				error = `Password must be at least ${result.userError.minimumLength} characters.`;
				break;
			case 'OTHER_ERROR':
				console.error('Sign-up failed:', result.userError.cause);
				error = 'Something went wrong. Please try again.';
				break;
			default:
				error = `Sign-up failed: ${result.userError.error}`;
		}
	}
</script>

<div class="flex min-h-screen w-full">
	<main class="mx-auto my-auto flex w-80 flex-col gap-4">
		<h2 class="text-2xl font-semibold tracking-tight">Create an account</h2>
		<form class="flex flex-col gap-2" {onsubmit}>
			<label class="label">
				<span class="label-text">Username</span>
				<input
					id="username"
					name="username"
					class="input"
					autocomplete="username"
					required
					bind:value={username}
					disabled={signup.pending}
				/>
			</label>
			<label class="label">
				<span class="label-text">Password</span>
				<input
					id="password"
					name="password"
					type="password"
					class="input"
					autocomplete="new-password"
					minlength={DEFAULT_MIN_PASSWORD_LENGTH}
					required
					bind:value={password}
					disabled={signup.pending}
				/>
			</label>
			{#if error}<p role="alert" class="text-error-500">{error}</p>{/if}
			<!-- Disabled until hydrated, so the form can't submit natively. -->
			<button class="btn preset-filled" type="submit" disabled={signup.pending || auth.isLoading}>
				{signup.pending ? 'Creating account…' : 'Sign up'}
			</button>
		</form>
		<a class="anchor" href="/signin">Already have an account? Sign in</a>
	</main>
</div>
