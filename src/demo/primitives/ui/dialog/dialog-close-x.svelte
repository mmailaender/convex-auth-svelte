<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';
	import { XIcon } from '@lucide/svelte';

	let { ref = $bindable(null), ...restProps }: DialogPrimitive.CloseTriggerProps = $props();
</script>

<DialogPrimitive.CloseTrigger
	bind:ref
	data-scope="dialog"
	data-part="close"
	class="hover:bg-surface-300-700 rounded-base absolute top-5 right-4 p-2 opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	type="button"
	{...restProps}
>
	<XIcon />
	<span class="sr-only">Close</span>
</DialogPrimitive.CloseTrigger>
