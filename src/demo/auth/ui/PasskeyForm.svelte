<!--
	Username + passkey, identifier-first: a free username creates an account
	with a new passkey, a taken one asks for its passkey. While the form is
	mounted, the browser also offers stored passkeys in the username field's
	autocompletion list, and picking one signs in right away.
-->
<script lang="ts">
	import { useHydrated } from '$demo/primitives/hooks/hydrated.svelte.js';
	import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
	import { useSignInWithUsernamePasskey } from '$lib/methods/username-passkey.svelte';
	import { api } from '$convex/_generated/api';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import { authErrorMessage, type AuthUserError } from '../errors.js';

	let { onsuccess }: { onsuccess?: () => void } = $props();

	// Mount this once per page: the browser runs one autofill request at a time.
	const hydrated = useHydrated();
	const passkey = useSignInWithUsernamePasskey(api.auth);

	let username = $state('');
	let error = $state<string | null>(null);

	function describe(userError: AuthUserError): string | null {
		// A second submit while the first still waits for its passkey.
		if (userError.error === 'ALREADY_PENDING') return null;
		return authErrorMessage(userError, {
			USERNAME_TAKEN: 'That username was just taken. Try another one.'
		});
	}

	// Autofill failures show where the form's own errors do, except an aborted
	// request: the user never opened a prompt, so there's nothing to tell them.
	// The browser refuses the background request, or another passkey prompt
	// took its place, and autofill stops for this page.
	$effect(() => {
		const lastError = passkey.autofill.lastError;
		if (lastError && lastError.error !== 'CEREMONY_ABORTED') error = describe(lastError);
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const result = await passkey.signIn({ username });
		if (result.status === 'complete') return onsuccess?.();
		error = describe(result.userError);
	}
</script>

<form
	class="flex flex-col gap-5"
	onsubmit={submit}
	aria-label="Sign in with a passkey"
	data-autofill={passkey.autofill.status}
>
	<p class="text-surface-700-300 text-sm">
		Enter a username. A new one creates your account with a passkey on this device; an existing one
		asks for its passkey.
	</p>
	<label class="flex flex-col">
		<span class="label">Username</span>
		<input
			class="input"
			name="username"
			autocomplete="username webauthn"
			autocapitalize="none"
			spellcheck="false"
			placeholder="ada"
			required
			bind:value={username}
			disabled={passkey.pending}
		/>
	</label>
	{#if error}<Alert>{error}</Alert>{/if}
	<button
		type="submit"
		class="btn preset-filled-primary-500 w-full gap-2"
		disabled={!hydrated.current || passkey.pending}
	>
		{#if passkey.pending}
			<Spinner />
			Waiting for your passkey…
		{:else}
			<FingerprintIcon class="size-4" />
			Continue with a passkey
		{/if}
	</button>
</form>
