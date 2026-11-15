<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { useAddPasskey, useRemovePasskey } from '$lib/methods/username-passkey.svelte';
	import { api } from '$lib/convex/_generated/api';

	const client = useConvexClient();
	const list = useQuery(api.auth.listPasskeys, {});
	const adder = useAddPasskey(api.auth);
	// One remove helper for the whole list, so two removals can't overlap.
	const remover = useRemovePasskey(api.auth);

	let error = $state<string | null>(null);

	const passkeys = $derived(list.data?.success ? list.data.passkeys : []);
	// The browser runs one passkey dialog at a time, so disable the buttons
	// that start a ceremony while one runs.
	const ceremonyRunning = $derived(adder.pending || remover.pending);
	// Another passkey must authorize each removal.
	const canRemove = $derived(passkeys.length > 1 && !ceremonyRunning);

	async function add() {
		error = null;
		const result = await adder.addPasskey();
		if (!result.success && result.userError.error !== 'ALREADY_PENDING') {
			error = result.userError.error;
		}
	}

	async function remove(passkeyId: string) {
		error = null;
		const result = await remover.removePasskey(passkeyId);
		if (!result.success && result.userError.error !== 'ALREADY_PENDING') {
			error = result.userError.error;
		}
	}

	async function rename(event: SubmitEvent, passkeyId: string) {
		event.preventDefault();
		error = null;
		const form = event.currentTarget as HTMLFormElement;
		const name = String(new FormData(form).get('name') ?? '');
		try {
			const result = await client.mutation(api.auth.renamePasskey, { passkeyId, name });
			if (result.success) {
				form.reset();
			} else {
				error = result.userError.error;
			}
		} catch (cause) {
			console.error('Passkey rename failed:', cause);
			error = 'OTHER_ERROR';
		}
	}
</script>

<section aria-labelledby="passkeys-heading">
	<h2 id="passkeys-heading">Your passkeys</h2>
	{#if list.data === undefined}
		<p>Loading your passkeys…</p>
	{:else if !list.data.success}
		<p role="alert">You are not signed in.</p>
	{:else}
		<ul aria-label="Passkeys">
			{#each passkeys as passkey (passkey.passkeyId)}
				<li>
					<span>{passkey.name ?? 'Unnamed passkey'}</span>
					<form aria-label="Rename passkey" onsubmit={(event) => rename(event, passkey.passkeyId)}>
						<label>
							New name
							<input name="name" required />
						</label>
						<button type="submit">Rename</button>
					</form>
					<button type="button" disabled={!canRemove} onclick={() => remove(passkey.passkeyId)}>
						Remove
					</button>
				</li>
			{/each}
		</ul>
		<button type="button" disabled={ceremonyRunning} onclick={add}>
			{adder.pending ? 'Waiting for your passkey…' : 'Add a passkey'}
		</button>
	{/if}
	{#if error}<p role="alert">{error}</p>{/if}
</section>
