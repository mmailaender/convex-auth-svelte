<!-- The outcome of an emailed link: in progress, done, or failed. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';

	let {
		status,
		title,
		children
	}: { status: 'loading' | 'complete' | 'error'; title: string; children?: Snippet } = $props();
</script>

<div class="flex flex-col gap-5" data-status={status} data-testid="link-status">
	<div
		class={[
			'flex size-14 items-center justify-center rounded-full',
			status === 'complete' && 'preset-tonal-success',
			status === 'error' && 'preset-tonal-error',
			status === 'loading' && 'bg-surface-200-800'
		]}
	>
		{#if status === 'loading'}
			<Spinner class="size-6" />
		{:else if status === 'complete'}
			<CircleCheckIcon class="size-7" />
		{:else}
			<CircleAlertIcon class="size-7" />
		{/if}
	</div>
	<h1 class="h5">{title}</h1>
	{@render children?.()}
</div>
