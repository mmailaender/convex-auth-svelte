<script lang="ts">
	import { cn } from '$demo/primitives/utils.js';
	import type { ImageCropperControlsProps } from './types';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...rest
	}: ImageCropperControlsProps = $props();
</script>

<div
	{...rest}
	bind:this={ref}
	class={cn('flex w-full items-center justify-end gap-2  pt-3', className)}
>
	{@render children?.()}
</div>
