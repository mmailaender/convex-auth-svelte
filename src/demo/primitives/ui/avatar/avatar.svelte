<script lang="ts">
	import { Avatar as AvatarPrimitive } from '@ark-ui/svelte/avatar';
	import { cn } from '$demo/primitives/utils.js';

	let { class: className, ...restProps }: AvatarPrimitive.RootProps = $props();
</script>

<AvatarPrimitive.Root
	class={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
	{...restProps}
/>
