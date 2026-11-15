<script lang="ts">
	import { Tabs as TabsPrimitive } from '@ark-ui/svelte/tabs';
	import { cn } from '$demo/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(
		'text-surface-700-300 rounded-base bg-transparent',
		'inline-flex items-center justify-center gap-1',
		'data-[orientation=horizontal]:w-fit',
		'data-[orientation=vertical]:w-full data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start',
		className
	)}
	{...restProps}
/>
