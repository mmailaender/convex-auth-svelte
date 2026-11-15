<script lang="ts">
	import { useImageCropperTrigger } from './image-cropper.svelte.js';
	import type { ImageCropperUploadTriggerProps } from './types';

	let { ref = $bindable(null), children, ...rest }: ImageCropperUploadTriggerProps = $props();

	const triggerState = useImageCropperTrigger();
</script>

<label
	bind:this={ref}
	for={triggerState.rootState.id}
	role="button"
	tabindex="0"
	class="hover:cursor-pointer"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const input = document.getElementById(triggerState.rootState.id) as HTMLInputElement | null;
			input?.click();
		}
	}}
	{...rest}
>
	{@render children?.()}
</label>
