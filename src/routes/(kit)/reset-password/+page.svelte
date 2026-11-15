<!-- Opened from the password reset email. Sets a new password and signs the user in. -->
<script lang="ts">
	import { strengthChecked } from '$demo/primitives/utils/passwordStrength.js';
	import { useHydrated } from '$demo/primitives/hooks/hydrated.svelte.js';
	import { page } from '$app/state';
	import { useCompletePasswordRecovery } from '$lib/methods/email-password.svelte';
	import { api } from '$lib/convex/_generated/api';
	import * as Password from '$demo/primitives/ui/password/index.js';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import { authErrorMessage } from '$demo/auth/errors.js';
	import AuthPage from '$demo/ui/AuthPage.svelte';
	import LinkStatus from '$demo/ui/LinkStatus.svelte';

	const hydrated = useHydrated();
	const recovery = useCompletePasswordRecovery(api.auth, {
		emailCode: page.url.searchParams.get('code') ?? ''
	});
	const link = $derived(recovery.current);

	let newPassword = $state('');
	let error = $state<string | null>(null);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		await strengthChecked(form);
		if (link.status !== 'ready') return;
		if (!form.checkValidity()) {
			form.querySelector<HTMLElement>(':invalid')?.focus();
			return;
		}
		error = null;
		const result = await link.completePasswordRecovery({ newPassword });
		if (result.status === 'error') error = authErrorMessage(result.userError);
	}
</script>

<AuthPage>
	{#if link.status === 'loading'}
		<LinkStatus status="loading" title="Checking your link…" />
	{:else if link.status === 'ready'}
		<form class="flex flex-col gap-5" onsubmit={submit} novalidate>
			<div class="flex flex-col gap-1.5">
				<h1 class="h5">Choose a new password</h1>
				<p class="text-surface-700-300 text-sm">You'll be signed in once it's saved.</p>
			</div>
			<div class="flex flex-col">
				<label class="label" for="new-password">New password</label>
				<Password.Root minScore={3}>
					<Password.Input
						id="new-password"
						name="new-password"
						autocomplete="new-password"
						required
						bind:value={newPassword}
						disabled={link.pending}
					>
						<Password.ToggleVisibility />
					</Password.Input>
					<Password.Strength />
					<Password.Error />
				</Password.Root>
			</div>
			{#if error}<Alert>{error}</Alert>{/if}
			<button
				type="submit"
				class="btn preset-filled-primary-500 w-full"
				disabled={!hydrated.current || link.pending}
			>
				{#if link.pending}<Spinner />{/if}
				Save password
			</button>
		</form>
	{:else if link.status === 'complete'}
		<LinkStatus status="complete" title="Your password is changed">
			<p class="text-surface-700-300 text-sm">You're signed in with your new password.</p>
			<a class="btn preset-filled-primary-500 w-full" href="/">Continue</a>
		</LinkStatus>
	{:else}
		<LinkStatus
			status="error"
			title={link.userError.error === 'MISSING_SECRET'
				? 'Open this link in the browser you asked from'
				: "This link can't reset your password"}
		>
			<p class="text-surface-700-300 text-sm">{authErrorMessage(link.userError)}</p>
			<a class="btn preset-tonal w-full" href="/signin">Back to sign in</a>
		</LinkStatus>
	{/if}
</AuthPage>
