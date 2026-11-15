<!-- A centered card for the sign-in page and the pages that emailed links open. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:py-16">
	<div
		class="bg-surface-50-950 border-surface-200-800 rounded-container w-full max-w-md border p-6 shadow-sm sm:p-10"
	>
		{@render children()}
	</div>
</div>
