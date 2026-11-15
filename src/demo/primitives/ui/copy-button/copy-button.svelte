<script lang="ts">
	// Svelte
	import { scale } from 'svelte/transition';

	// Hooks
	import { UseClipboard } from '$demo/primitives/hooks/use-clipboard.svelte.js';
	// Utils
	import { cn } from '$demo/primitives/utils.js';

	// Icons
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import XIcon from '@lucide/svelte/icons/x';

	// Types
	import type { CopyButtonProps } from './types';

	let {
		ref = $bindable(null),
		text,
		icon,
		animationDuration = 500,
		onCopy,
		class: className,
		tabindex = -1,
		children,
		...rest
	}: CopyButtonProps = $props();

	const clipboard = new UseClipboard();
</script>

<button
	bind:this={ref}
	{...rest}
	{tabindex}
	class={cn(children ? 'btn hover:preset-tonal' : 'btn-icon hover:preset-tonal', className)}
	type="button"
	name="copy"
	onclick={async () => {
		const status = await clipboard.copy(text);

		onCopy?.(status);
	}}
>
	{#if clipboard.status === 'success'}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			<CheckIcon tabindex={-1} class="size-4" />
			<span class="sr-only">Copied</span>
		</div>
	{:else if clipboard.status === 'failure'}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			<XIcon tabindex={-1} class="size-4" />
			<span class="sr-only">Failed to copy</span>
		</div>
	{:else}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			{#if icon}
				{@render icon()}
			{:else}
				<CopyIcon tabindex={-1} class="size-4" />
			{/if}
			<span class="sr-only">Copy</span>
		</div>
	{/if}
	{@render children?.()}
</button>
