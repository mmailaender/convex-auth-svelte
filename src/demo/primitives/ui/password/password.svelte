<script lang="ts">
	import { box } from 'svelte-toolbelt';
	import { usePassword, usePasswordError } from './password.svelte.js';
	import type { PasswordRootProps } from './types';
	import { cn } from '$demo/primitives/utils.js';

	let {
		ref = $bindable(null),
		hidden = $bindable(true),
		minScore = 3,
		class: className,
		children,
		onerror
	}: PasswordRootProps = $props();

	// Set up password context
	usePassword({
		hidden: box.with(
			() => hidden,
			(v) => (hidden = v)
		),
		minScore: box.with(() => minScore)
	});

	// Derive error state and invoke callback when present
	const errorState = usePasswordError();
	let lastErrorMsg: string | null = $state(null);
	$effect(() => {
		const msg = errorState.message;
		if (!msg) {
			lastErrorMsg = null;
			return;
		}
		if (msg !== lastErrorMsg) {
			onerror?.({ message: msg });
			lastErrorMsg = msg;
		}
	});
</script>

<div bind:this={ref} class={cn('flex flex-col gap-1.5', className)}>
	{@render children?.()}
</div>
