<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';
	import { cn } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.DescriptionProps = $props();
</script>

<DialogPrimitive.Description
	bind:ref
	data-slot="dialog-description"
	class={cn('text-surface-600-400 w-full text-left text-sm', className)}
	{...restProps}
/>
