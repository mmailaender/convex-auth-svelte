<script lang="ts">
	import { Tabs as TabsPrimitive } from '@ark-ui/svelte/tabs';
	import { cn } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable<string | undefined>(),
		class: className,
		...restProps
	}: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root
	bind:ref
	bind:value
	class={cn(
		'flex',
		'data-[orientation=vertical]:w-full data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-row data-[orientation=vertical]:items-start',
		'data-[orientation=horizontal]:flex-col',
		className
	)}
	{...restProps}
/>
