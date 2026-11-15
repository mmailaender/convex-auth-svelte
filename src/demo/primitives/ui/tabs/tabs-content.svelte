<script lang="ts">
	import { Tabs as TabsPrimitive } from '@ark-ui/svelte/tabs';
	import { cn } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
	bind:ref
	data-slot="tabs-content"
	class={cn(
		'outline-none',
		'data-[orientation=horizontal]:flex-1',
		'w-full data-[orientation=vertical]:p-8 data-[orientation=vertical]:pt-6 ',
		className
	)}
	{...restProps}
/>
