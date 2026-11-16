<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';

	let { ref = $bindable(null), ...restProps }: DialogPrimitive.CloseTriggerProps = $props();
</script>

<DialogPrimitive.CloseTrigger
	bind:ref
	data-scope="dialog"
	data-part="close"
	type="button"
	{...restProps}
/>
