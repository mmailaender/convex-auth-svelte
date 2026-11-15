<script lang="ts">
	import { cn, type WithElementRef } from '$demo/primitives/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

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
	data-part="footer"
	class={cn('flex justify-end gap-2 pt-6 md:flex-row', className)}
	{...restProps}
>
	{@render children?.()}
</div>
