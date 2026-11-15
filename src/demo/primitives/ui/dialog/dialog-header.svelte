<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-scope="dialog"
	data-part="header"
	class={cn('flex flex-col gap-2 text-center sm:text-left', className)}
	{...restProps}
>
	{@render children?.()}
</div>
