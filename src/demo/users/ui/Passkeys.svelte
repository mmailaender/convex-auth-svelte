<!--
	The passkeys of a username + passkey account: add one (on this device or a
	security key), rename one, or remove one. Each change asks for a passkey,
	and the last passkey can't be removed.
-->
<script lang="ts">
	import { toast } from 'svelte-sonner';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { useAddPasskey, useRemovePasskey } from '$lib/methods/username-passkey.svelte';
	import { api } from '$convex/_generated/api';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import { authErrorMessage, type AuthUserError } from '$demo/auth/errors.js';

	const client = useConvexClient();
	const list = useQuery(api.auth.listPasskeys, {});
	const adder = useAddPasskey(api.auth);
	// One remover for the whole list, so two removals can't overlap.
	const remover = useRemovePasskey(api.auth);

	const passkeys = $derived(list.data?.success ? list.data.passkeys : []);
	// The browser runs one passkey prompt at a time.
	const busy = $derived(adder.pending || remover.pending);

	let error = $state<string | null>(null);
	let removingId = $state<string | null>(null);
	let renamingId = $state<string | null>(null);
	let newName = $state('');
	let savingName = $state(false);

	function fail(userError: AuthUserError) {
		if (userError.error !== 'ALREADY_PENDING') error = authErrorMessage(userError);
	}

	async function add() {
		error = null;
		const result = await adder.addPasskey();
		if (result.success) toast.success('Passkey added');
		else fail(result.userError);
	}

	async function remove(passkeyId: string) {
		error = null;
		removingId = passkeyId;
		const result = await remover.removePasskey(passkeyId);
		removingId = null;
		if (result.success) toast.success('Passkey removed');
		else fail(result.userError);
	}

	async function rename(event: SubmitEvent, passkeyId: string) {
		event.preventDefault();
		error = null;
		savingName = true;
		try {
			const result = await client.mutation(api.auth.renamePasskey, {
				passkeyId,
				name: newName.trim()
			});
			if (result.success) renamingId = null;
			else fail(result.userError);
		} catch (cause) {
			fail({ error: 'OTHER_ERROR', cause });
		} finally {
			savingName = false;
		}
	}

	const added = (createdAt: number) =>
		new Date(createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });
</script>

<div class="flex flex-col gap-3">
	{#if list.data === undefined}
		<div class="placeholder h-16 w-full animate-pulse"></div>
	{:else}
		<ul class="flex flex-col gap-2" aria-label="Passkeys">
			{#each passkeys as passkey (passkey.passkeyId)}
				<li class="border-surface-300-700 rounded-container border px-3.5 py-2.5">
					{#if renamingId === passkey.passkeyId}
						<form
							class="flex flex-col gap-3"
							aria-label="Rename passkey"
							onsubmit={(event) => rename(event, passkey.passkeyId)}
						>
							<input
								class="input"
								aria-label="Passkey name"
								maxlength="50"
								required
								bind:value={newName}
								disabled={savingName}
							/>
							<div class="flex gap-1.5">
								<button
									type="button"
									class="btn btn-sm preset-tonal w-full"
									onclick={() => (renamingId = null)}
								>
									Cancel
								</button>
								<button
									type="submit"
									class="btn btn-sm preset-filled-primary-500 w-full"
									disabled={savingName || !newName.trim()}
								>
									Save
								</button>
							</div>
						</form>
					{:else}
						<div class="flex items-center gap-3">
							<KeyRoundIcon class="text-surface-600-400 size-4 shrink-0" />
							<div class="flex min-w-0 flex-1 flex-col">
								<span class="truncate text-sm" data-testid="passkey-name">
									{passkey.name ?? 'Unnamed passkey'}
								</span>
								<span class="text-surface-600-400 text-xs">Added {added(passkey.createdAt)}</span>
							</div>
							<button
								type="button"
								class="btn-icon btn-sm hover:preset-tonal"
								aria-label={`Rename ${passkey.name ?? 'passkey'}`}
								onclick={() => {
									renamingId = passkey.passkeyId;
									newName = passkey.name ?? '';
								}}
							>
								<PencilIcon class="size-4" />
							</button>
							<button
								type="button"
								class="btn-icon btn-sm hover:preset-tonal-error"
								aria-label={`Remove ${passkey.name ?? 'passkey'}`}
								title={passkeys.length < 2
									? 'Add another passkey before you remove this one.'
									: undefined}
								disabled={busy || passkeys.length < 2}
								onclick={() => remove(passkey.passkeyId)}
							>
								{#if removingId === passkey.passkeyId}<Spinner />{:else}<Trash2Icon
										class="size-4"
									/>{/if}
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
		{#if error}<Alert>{error}</Alert>{/if}
		<button type="button" class="btn preset-tonal gap-2" disabled={busy} onclick={add}>
			{#if adder.pending}<Spinner />Waiting for your passkey…{:else}<PlusIcon class="size-4" />Add a
				passkey{/if}
		</button>
	{/if}
</div>
