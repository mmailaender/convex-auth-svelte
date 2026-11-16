<!-- The avatar and the display name of the signed-in user, both editable in place. -->
<script lang="ts">
	import { tick } from 'svelte';
	import { toast } from 'svelte-sonner';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { useConvexClient } from 'convex-svelte';
	import type { Id } from '$convex/_generated/dataModel';
	import { api } from '$convex/_generated/api';
	import * as Avatar from '$demo/primitives/ui/avatar/index.js';
	import * as ImageCropper from '$demo/primitives/ui/image-cropper/index.js';
	import { getFileFromUrl } from '$demo/primitives/ui/image-cropper/index.js';
	import { optimizeImage } from '$demo/primitives/utils/optimizeImage.js';
	import type { Viewer } from './viewer.js';

	let { viewer }: { viewer: Viewer } = $props();

	const client = useConvexClient();

	let editingName = $state(false);
	let name = $state('');
	let nameInput = $state<HTMLInputElement | null>(null);
	let savingName = $state(false);
	let cropSrc = $state('');
	let uploading = $state(false);

	$effect(() => {
		if (!editingName) name = viewer.name;
	});
	$effect(() => {
		if (viewer.image && !cropSrc.startsWith('blob:')) cropSrc = viewer.image;
	});

	async function startEditingName() {
		editingName = true;
		name = viewer.name;
		await tick();
		nameInput?.focus();
		nameInput?.select();
	}

	async function saveName(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = name.trim();
		if (!trimmed || trimmed === viewer.name) {
			editingName = false;
			return;
		}
		savingName = true;
		try {
			await client.mutation(api.users.updateName, { name: trimmed });
			editingName = false;
			toast.success('Name updated');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't update the name.");
		} finally {
			savingName = false;
		}
	}

	async function uploadAvatar(url: string) {
		const previous = viewer.image ?? '';
		cropSrc = url;
		uploading = true;
		try {
			const file = await optimizeImage(await getFileFromUrl(url, 'avatar.png'), {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});
			const uploadUrl = await client.mutation(api.users.generateAvatarUploadUrl, {});
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': file.type },
				body: file
			});
			if (!response.ok) throw new Error('The upload failed.');
			const { storageId } = (await response.json()) as { storageId: Id<'_storage'> };
			await client.mutation(api.users.updateAvatar, { storageId });
			toast.success('Avatar updated');
		} catch (error) {
			cropSrc = previous;
			toast.error(error instanceof Error ? error.message : "Couldn't update the avatar.");
		} finally {
			uploading = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="w-fit">
		<ImageCropper.Root bind:src={cropSrc} accept="image/*" onCropped={uploadAvatar}>
			<ImageCropper.UploadTrigger>
				<div class="relative size-20 cursor-pointer" aria-label="Change avatar">
					<Avatar.Root class="size-20">
						<Avatar.Image src={cropSrc || viewer.image} alt={viewer.name} />
						<Avatar.Fallback>
							<Avatar.Marble name={viewer.name} />
						</Avatar.Fallback>
					</Avatar.Root>
					{#if uploading}
						<div
							class="bg-surface-50-950/70 absolute inset-0 flex items-center justify-center rounded-full"
						>
							<div
								class="size-6 animate-spin rounded-full border-2 border-current border-b-transparent"
							></div>
						</div>
					{/if}
					<span
						class="preset-filled-surface-300-700 ring-surface-50-950 absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full ring-4"
					>
						<PencilIcon class="size-3.5" />
					</span>
				</div>
			</ImageCropper.UploadTrigger>
			<ImageCropper.Dialog>
				<ImageCropper.Cropper cropShape="round" />
				<ImageCropper.Controls>
					<ImageCropper.Cancel />
					<ImageCropper.Crop>Upload</ImageCropper.Crop>
				</ImageCropper.Controls>
			</ImageCropper.Dialog>
		</ImageCropper.Root>
	</div>

	<div
		class={[
			'border-surface-300-700 rounded-container relative border px-3.5 py-2 transition-colors',
			!editingName && 'hover:bg-surface-200-800 cursor-pointer'
		]}
	>
		<span class="text-surface-600-400 text-xs">Name</span>
		{#if editingName}
			<form class="mt-1 mb-1 flex flex-col gap-3" onsubmit={saveName}>
				<input
					bind:this={nameInput}
					class="input"
					aria-label="Name"
					maxlength="64"
					bind:value={name}
					disabled={savingName}
				/>
				<div class="flex gap-1.5">
					<button
						type="button"
						class="btn btn-sm preset-tonal w-full"
						onclick={() => (editingName = false)}
						disabled={savingName}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn btn-sm preset-filled-primary-500 w-full"
						disabled={savingName || !name.trim() || name.trim() === viewer.name}
					>
						Save
					</button>
				</div>
			</form>
		{:else}
			<div class="mt-0.5 flex items-center justify-between gap-3">
				<span class="truncate text-sm" data-testid="profile-name">{viewer.name}</span>
				<PencilIcon class="text-surface-600-400 size-4 shrink-0" />
			</div>
			<button
				type="button"
				class="absolute inset-0"
				aria-label="Edit name"
				onclick={startEditingName}
			></button>
		{/if}
	</div>
</div>
