<script lang="ts">
	import * as Dialog from '$demo/primitives/ui/dialog/index.js';
	import { cn } from '$demo/primitives/utils.js';
	import { useImageCropperDialog } from './image-cropper.svelte.js';
	import type { ImageCropperDialogProps } from './types';

	let { children, class: className, ...rest }: ImageCropperDialogProps = $props();

	const dialogState = useImageCropperDialog();
</script>

<Dialog.Root bind:open={dialogState.rootState.open}>
	<Dialog.Content
		{...rest}
		class={cn('max-h-[85vh] min-h-96 max-w-full p-4 sm:max-w-md sm:p-5', className)}
	>
		<div class="flex min-h-0 w-full flex-1 flex-col gap-4">
			{@render children?.()}
		</div>
	</Dialog.Content>
</Dialog.Root>
