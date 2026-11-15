<script lang="ts">
	import { cn, type WithElementRef } from '$demo/primitives/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'horizontal',
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		orientation?: 'horizontal' | 'vertical';
	} = $props();
</script>

<div
	bind:this={ref}
	role="separator"
	aria-orientation={orientation === 'vertical' ? 'vertical' : 'horizontal'}
	data-slot="separator"
	data-orientation={orientation}
	class={cn(
		'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
		className
	)}
	{...restProps}
></div>
