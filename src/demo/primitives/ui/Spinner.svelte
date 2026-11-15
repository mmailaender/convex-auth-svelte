<script lang="ts">
	import { cn } from '$demo/primitives/utils.js';

	let { class: className }: { class?: string } = $props();
</script>

<span
	class={cn(
		'inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent',
		className
	)}
	aria-hidden="true"
></span>
