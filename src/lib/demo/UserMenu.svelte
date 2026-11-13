<script lang="ts">
	import { goto } from '$app/navigation';

	import { Avatar, Popover } from '@skeletonlabs/skeleton-svelte';

	import { useAuthActions } from '$lib/svelte/index.svelte';
	import type { Id } from '$lib/convex/_generated/dataModel.js';

	interface Props {
		viewer: {
			_id: Id<'users'>;
			name: string;
			image?: string;
		};
	}

	let { viewer }: Props = $props();

	const { signOut } = useAuthActions();

	async function handleSignOut() {
		await signOut();
		await goto('/');
	}

	let openState = $state(false);
</script>

<div class="flex items-center gap-2 text-sm font-medium">
	<Popover
		open={openState}
		onOpenChange={(e) => (openState = e.open)}
		positioning={{ placement: 'top' }}
		triggerBase="btn"
		contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px]"
		arrow
		ids={{ trigger: 'user-menu-trigger' }}
	>
		{#snippet trigger()}
			<Avatar src={viewer.image} name={viewer.name} size="size-10" />
		{/snippet}
		{#snippet content()}
			<div class="px-2 py-1.5 text-sm font-semibold">{viewer.name}</div>
			<hr class="hr border-surface-300-700" />
			<button class="btn hover:preset-tonal w-full" onclick={handleSignOut}>Sign out</button>
		{/snippet}
	</Popover>
</div>
