<script lang="ts">
	import { cn } from '$demo/primitives/utils.js';
	import { Popover as PopoverPrimitive } from '@ark-ui/svelte/popover';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PopoverPrimitive.TriggerProps = $props();
</script>

<PopoverPrimitive.Trigger
	bind:ref
	data-slot="popover-trigger"
	class={cn('', className)}
	{...restProps}
/>
