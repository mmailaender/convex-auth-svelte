<script lang="ts">
	import { Avatar as AvatarPrimitive } from '@ark-ui/svelte/avatar';
	import { cn } from '$demo/primitives/utils.js';

	let { class: className, ...restProps }: AvatarPrimitive.FallbackProps = $props();
</script>

<AvatarPrimitive.Fallback
	class={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
	{...restProps}
/>
