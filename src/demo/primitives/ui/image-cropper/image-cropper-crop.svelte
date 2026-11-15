<script lang="ts">
	import { useImageCropperCrop } from './image-cropper.svelte.js';
	import CropIcon from '@lucide/svelte/icons/crop';
	import { cn } from '$demo/primitives/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type ButtonProps = Omit<HTMLAttributes<HTMLButtonElement>, 'children'> & {
		ref?: HTMLButtonElement | null;
		children?: Snippet;
	};

	let {
		ref = $bindable(null),
		onclick,
		class: className,
		children,
		...rest
	}: ButtonProps = $props();

	const cropState = useImageCropperCrop();
</script>

<button
	{...rest}
	bind:this={ref}
	class={cn('btn preset-filled-primary-500', className)}
	onclick={(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => {
		onclick?.(e);

		cropState.onclick();
	}}
>
	{#if children}
		{@render children()}
	{:else}
		<CropIcon class="size-4" />
		<span>Crop</span>
	{/if}
</button>
