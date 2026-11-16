<!--
	Change the password of an email or username account. Asks for the current
	password first, and can sign out every other session at the same time.
-->
<script lang="ts">
	import { strengthChecked } from '$demo/primitives/utils/passwordStrength.js';
	import { useHydrated } from '$demo/primitives/hooks/hydrated.svelte.js';
	import { toast } from 'svelte-sonner';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/convex/_generated/api';
	import * as Password from '$demo/primitives/ui/password/index.js';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import { authErrorMessage } from '$demo/auth/errors.js';
	import { viewerIdentifier, type Viewer } from './viewer.js';

	let { viewer }: { viewer: Viewer } = $props();

	const hydrated = useHydrated();
	const client = useConvexClient();

	let open = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let signOutOtherSessions = $state(true);
	let pending = $state(false);
	let error = $state<string | null>(null);

	function reset() {
		open = false;
		currentPassword = '';
		newPassword = '';
		error = null;
	}

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
		pending = true;
		try {
			const args = { currentPassword, newPassword, signOutOtherSessions };
			const result =
				viewer.method === 'emailPassword'
					? await client.mutation(api.auth.changeEmailPassword, args)
					: await client.mutation(api.auth.changeUsernamePassword, args);
			if (result.success) {
				reset();
				toast.success('Password changed');
				return;
			}
			const { userError } = result;
			error = authErrorMessage(userError, {
				INVALID_CREDENTIALS: 'Your current password is incorrect.',
				RATE_LIMITED: (e) =>
					`Too many attempts. Try again in ${Math.ceil(Number(e.retryAfterMs) / 1000)} seconds.`
			});
		} catch (cause) {
			error = authErrorMessage({ error: 'OTHER_ERROR', cause });
		} finally {
			pending = false;
		}
	}
</script>

<div class="border-surface-300-700 rounded-container border px-3.5 py-2">
	<div class="flex items-center justify-between gap-3">
		<div class="flex flex-col">
			<span class="text-surface-600-400 text-xs">Password</span>
			<span class="text-sm tracking-widest">••••••••••</span>
		</div>
		{#if !open}
			<button type="button" class="btn btn-sm preset-tonal" onclick={() => (open = true)}>
				Change
			</button>
		{/if}
	</div>
	{#if open}
		<form class="mt-3 mb-1.5 flex flex-col gap-4" onsubmit={submit} novalidate>
			<!-- Tells password managers which login to update. -->
			<input
				id="username"
				name="username"
				type="text"
				autocomplete="username"
				value={viewerIdentifier(viewer)}
				readonly
				hidden
			/>
			<div class="flex flex-col">
				<label class="label" for="current-password">Current password</label>
				<Password.Root minScore={0}>
					<Password.Input
						id="current-password"
						name="current-password"
						autocomplete="current-password"
						required
						bind:value={currentPassword}
						disabled={pending}
					>
						<Password.ToggleVisibility />
					</Password.Input>
					<Password.Error />
				</Password.Root>
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
						disabled={pending}
					>
						<Password.ToggleVisibility />
					</Password.Input>
					<Password.Strength />
					<Password.Error />
				</Password.Root>
			</div>
			<label class="flex items-center gap-2.5 text-sm">
				<input
					type="checkbox"
					class="checkbox"
					bind:checked={signOutOtherSessions}
					disabled={pending}
				/>
				Sign out of all other devices
			</label>
			{#if error}<Alert>{error}</Alert>{/if}
			<div class="flex gap-1.5">
				<button type="button" class="btn btn-sm preset-tonal w-full" onclick={reset}>
					Cancel
				</button>
				<button
					type="submit"
					class="btn btn-sm preset-filled-primary-500 w-full"
					disabled={!hydrated.current || pending || checking}
				>
					{#if pending || checking}<Spinner />{/if}
					Change password
				</button>
			</div>
		</form>
	{/if}
</div>
