<script lang="ts">
	import { Tabs as TabsPrimitive } from '@ark-ui/svelte/tabs';
	import { cn } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"btn text-surface-700-300 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring aria-selected:preset-filled-surface-300-700 whitespace-nowrap focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 aria-selected:pointer-events-none aria-selected:cursor-default aria-selected:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		'data-[orientation=horizontal]:h-[calc(100%-1px)] data-[orientation=horizontal]:flex-1 data-[orientation=horizontal]:justify-center',
		'[&:not([aria-selected=true]):hover]:preset-filled-surface-200-800 data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-[orientation=vertical]:text-left',
		className
	)}
	{...restProps}
/>
