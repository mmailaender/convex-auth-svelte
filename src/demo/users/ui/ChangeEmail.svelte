<!--
	The email address of an email + password account. Changing it asks for the
	current password, then emails a confirmation link to the new address; the
	address changes once that link is opened.
-->
<script lang="ts">
	import { useHydrated } from '$demo/primitives/hooks/hydrated.svelte.js';
	import { useStartChangeEmail } from '$lib/methods/email-password.svelte';
	import { api } from '$convex/_generated/api';
	import * as Password from '$demo/primitives/ui/password/index.js';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import CheckInbox from '$demo/auth/ui/CheckInbox.svelte';
	import { authErrorMessage } from '$demo/auth/errors.js';
	import type { Viewer } from './viewer.js';

	let { viewer }: { viewer: Viewer } = $props();

	const hydrated = useHydrated();
	const flow = useStartChangeEmail(api.auth);

	let view = $state<'show' | 'edit' | 'sent'>('show');
	let newEmail = $state('');
	let currentPassword = $state('');
	let error = $state<string | null>(null);

	function cancel() {
		view = 'show';
		newEmail = '';
		currentPassword = '';
		error = null;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const result = await flow.startChangeEmail({ newEmail, currentPassword });
		if (result.success) {
			currentPassword = '';
			view = 'sent';
			return;
		}
		error = authErrorMessage(result.userError, {
			INVALID_CREDENTIALS: 'Your current password is incorrect.'
		});
	}
</script>

<div class="border-surface-300-700 rounded-container border px-3.5 py-2">
	<div class="flex items-center justify-between gap-3">
		<div class="flex min-w-0 flex-col">
			<span class="text-surface-600-400 text-xs">Email address</span>
			<span class="flex items-center gap-2 text-sm">
				<span class="truncate" data-testid="profile-email">{viewer.email}</span>
				<span class="badge preset-tonal-success text-xs">Verified</span>
			</span>
		</div>
		{#if view === 'show'}
			<button type="button" class="btn btn-sm preset-tonal" onclick={() => (view = 'edit')}>
				Change
			</button>
		{/if}
	</div>
	{#if view === 'edit'}
		<form class="mt-3 mb-1.5 flex flex-col gap-4" onsubmit={submit}>
			<label class="flex flex-col">
				<span class="label">New email address</span>
				<input
					class="input"
					type="email"
					name="new-email"
					autocomplete="email"
					required
					bind:value={newEmail}
					disabled={flow.pending}
				/>
			</label>
			<div class="flex flex-col">
				<label class="label" for="change-email-password">Current password</label>
				<Password.Root minScore={0}>
					<Password.Input
						id="change-email-password"
						name="current-password"
						autocomplete="current-password"
						required
						bind:value={currentPassword}
						disabled={flow.pending}
					>
						<Password.ToggleVisibility />
					</Password.Input>
				</Password.Root>
			</div>
			{#if error}<Alert>{error}</Alert>{/if}
			<div class="flex gap-1.5">
				<button type="button" class="btn btn-sm preset-tonal w-full" onclick={cancel}>
					Cancel
				</button>
				<button
					type="submit"
					class="btn btn-sm preset-filled-primary-500 w-full"
					disabled={!hydrated.current || flow.pending}
				>
					{#if flow.pending}<Spinner />{/if}
					Send confirmation link
				</button>
			</div>
		</form>
	{:else if view === 'sent'}
		<div class="mt-4 mb-2">
			<CheckInbox
				email={newEmail}
				title="Confirm your new address"
				message="Open it to switch your account to this address. Until then, you keep signing in with the current one."
				onback={cancel}
				backLabel="Done"
			/>
		</div>
	{/if}
</div>
