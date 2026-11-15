<script module lang="ts">
	let dialogIdCounter = 0;

	function nextDialogId() {
		dialogIdCounter += 1;
		return `dialog-${dialogIdCounter}`;
	}
</script>

<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';

	const fallbackId = nextDialogId();

	let {
		open = $bindable(false),
		ids,
		onInteractOutside,
		...restProps
	}: DialogPrimitive.RootProps = $props();

	const resolvedIds = $derived({
		...ids,
		backdrop:
			typeof ids?.backdrop === 'string' && ids.backdrop.length > 0
				? ids.backdrop
				: `${fallbackId}-backdrop`,
		positioner:
			typeof ids?.positioner === 'string' && ids.positioner.length > 0
				? ids.positioner
				: `${fallbackId}-positioner`,
		content:
			typeof ids?.content === 'string' && ids.content.length > 0
				? ids.content
				: `${fallbackId}-content`
	});

	function handleInteractOutside(
		event: Parameters<NonNullable<DialogPrimitive.RootProps['onInteractOutside']>>[0]
	) {
		const originalEvent = event.detail?.originalEvent || event.detail;

		if (originalEvent instanceof Event && originalEvent.target instanceof Element) {
			const sonnerElement = originalEvent.target.closest('[data-sonner-toast]');
			if (sonnerElement) {
				event.preventDefault();
				return;
			}
		}

		onInteractOutside?.(event);
	}
</script>

<DialogPrimitive.Root
	bind:open
	ids={resolvedIds}
	onInteractOutside={handleInteractOutside}
	{...restProps}
/>
