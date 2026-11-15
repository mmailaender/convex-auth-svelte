<script lang="ts">
	import { useSignInWithUsernamePasskey } from '$lib/methods/username-passkey.svelte';
	import { api } from '$lib/convex/_generated/api';

	// While this component is mounted, the browser also offers the stored
	// passkeys in the autocompletion list of the username field.
	const login = useSignInWithUsernamePasskey(api.auth);

	let username = $state('');
	let error = $state<string | null>(null);

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const result = await login.signIn({ username });
		if (result.status === 'error' && result.userError.error !== 'ALREADY_PENDING') {
			if (result.userError.error === 'OTHER_ERROR') {
				console.error('Passkey sign-in failed:', result.userError.cause);
			}
			error = result.userError.error;
		}
	}
</script>

<form aria-label="Sign in with a passkey" {onsubmit}>
	<label>
		Username
		<input
			name="username"
			autocomplete="username webauthn"
			required
			bind:value={username}
			disabled={login.pending}
		/>
	</label>
	<button type="submit" disabled={login.pending}>
		{login.pending ? 'Waiting for your passkey…' : 'Continue with a passkey'}
	</button>
	{#if error}<p role="alert">{error}</p>{/if}
	{#if login.autofill.lastError}<p role="alert">{login.autofill.lastError.error}</p>{/if}
	<p>Passkey autofill: {login.autofill.status}</p>
</form>
