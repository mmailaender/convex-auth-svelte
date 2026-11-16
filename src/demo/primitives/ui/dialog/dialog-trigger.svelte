<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';

	let { ref = $bindable(null), ...restProps }: DialogPrimitive.TriggerProps = $props();
</script>

<DialogPrimitive.Trigger bind:ref data-slot="dialog-trigger" {...restProps} />
