<script lang="ts">
	import { Avatar as AvatarPrimitive } from '@ark-ui/svelte/avatar';
	import { cn } from '$demo/primitives/utils.js';

	let { class: className, ...restProps }: AvatarPrimitive.ImageProps = $props();
</script>

<AvatarPrimitive.Image class={cn('aspect-square size-full', className)} {...restProps} />
