<script lang="ts">
	// Svelte
	import { SvelteSet } from 'svelte/reactivity';

	import { cn } from '$demo/primitives/utils.js';
	import { usePasswordError } from './password.svelte.js';

	let { class: className }: { class?: string } = $props();

	const error = usePasswordError();
	const message = $derived(error.message);

	// Unique id for aria-describedby linkage (lazily generated to avoid SSR mismatch)
	let id = $state('');

	$effect(() => {
		const input = error.inputEl;
		if (!input) return;

		if (!id) id = `password-error-${Math.random().toString(36).slice(2, 9)}`;
		const current = input.getAttribute('aria-describedby') ?? '';
		const tokens = new SvelteSet(current.split(/\s+/).filter(Boolean));
		if (message) tokens.add(id);
		else tokens.delete(id);
		const next = Array.from(tokens).join(' ');
		if (next) input.setAttribute('aria-describedby', next);
		else input.removeAttribute('aria-describedby');

		return () => {
			const inp = error.inputEl;
			if (!inp) return;
			const cur = inp.getAttribute('aria-describedby') ?? '';
			const parts = cur
				.split(/\s+/)
				.filter(Boolean)
				.filter((x) => x !== id);
			if (parts.length) inp.setAttribute('aria-describedby', parts.join(' '));
			else inp.removeAttribute('aria-describedby');
		};
	});
</script>

{#if message}
	<span
		id={id || undefined}
		class={cn('text-error-600-400 pb-1 text-xs', className)}
		aria-live="polite"
		role="status"
	>
		{message}
	</span>
{/if}
