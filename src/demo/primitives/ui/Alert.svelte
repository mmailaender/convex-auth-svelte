<!--
	An inline message for the result of a form: an error, a success, or a note.
	Errors are announced right away, the others politely.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { cn } from '$demo/primitives/utils.js';

	let {
		tone = 'error',
		class: className,
		children
	}: { tone?: 'error' | 'success' | 'info'; class?: string; children: Snippet } = $props();

	const Icon = $derived(
		tone === 'error' ? CircleAlertIcon : tone === 'success' ? CircleCheckIcon : InfoIcon
	);
</script>

<div
	role={tone === 'error' ? 'alert' : 'status'}
	class={cn(
		'rounded-base flex items-start gap-2.5 px-3 py-2.5 text-sm',
		tone === 'error' && 'preset-tonal-error',
		tone === 'success' && 'preset-tonal-success',
		tone === 'info' && 'preset-tonal-surface',
		className
	)}
>
	<Icon class="mt-0.5 size-4 shrink-0" />
	<div class="min-w-0 flex-1">{@render children()}</div>
</div>
