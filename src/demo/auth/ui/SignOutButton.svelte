<script lang="ts">
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { useAuthActions } from '$lib/svelte/index.svelte';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import { cn } from '$demo/primitives/utils.js';

	let { class: className, onsignout }: { class?: string; onsignout?: () => void } = $props();

	const { signOut } = useAuthActions();
	let pending = $state(false);

	async function handleClick() {
		pending = true;
		try {
			await signOut();
			onsignout?.();
		} finally {
			pending = false;
		}
	}
</script>

<button type="button" class={cn('btn gap-2', className)} disabled={pending} onclick={handleClick}>
	{#if pending}<Spinner />{:else}<LogOutIcon class="size-4" />{/if}
	Sign out
</button>
