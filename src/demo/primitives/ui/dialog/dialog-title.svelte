<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';
	import { cn } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
	bind:ref
	data-scope="dialog"
	data-part="title"
	class={cn('h5 text-left leading-none tracking-tight', className)}
	{...restProps}
/>
