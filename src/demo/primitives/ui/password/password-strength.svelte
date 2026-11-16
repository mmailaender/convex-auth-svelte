<script lang="ts">
	import { tv } from 'tailwind-variants';
	import { usePasswordStrength } from './password.svelte.js';
	import type { PasswordStrengthProps } from './types.js';
	import { Progress as ProgressPrimitive } from '@ark-ui/svelte/progress';
	import { cn } from '$demo/primitives/utils.js';
	import { PASSWORD_STRENGTH_LABEL } from '$demo/primitives/utils/passwordStrength.js';

	let { class: className }: PasswordStrengthProps = $props();

	const state = usePasswordStrength();

	const score = $derived(state.score);

	const color = tv({
		base: '',
		variants: {
			score: {
				0: 'bg-error-600-400',
				1: 'bg-error-600-400',
				2: 'bg-warning-700-300',
				3: 'bg-warning-600-400',
				4: 'bg-success-600-400'
			}
		}
	});
</script>

<ProgressPrimitive.Root
	value={score}
	class={cn('bg-surface-200-800 relative h-1 w-full gap-1 overflow-hidden rounded-full', className)}
	min={0}
	max={4}
>
	<!-- The track is the progressbar: Ark gives it the role and the value attributes -->
	<ProgressPrimitive.Track
		class="h-full w-full"
		aria-label={PASSWORD_STRENGTH_LABEL}
		aria-valuetext={state.text}
	>
		<!-- Ark sets the range's width to the score's share of 4 -->
		<ProgressPrimitive.Range class={cn('h-full transition-all duration-500', color({ score }))} />
	</ProgressPrimitive.Track>
	<!-- This creates the gaps between the bars -->
	<div class="absolute top-0 left-0 z-10 flex h-1 w-full place-items-center gap-1 px-0.5">
		{#each Array.from({ length: 4 }).keys() as i (i)}
			<div class="ring-surface-100-900 h-1 w-1/4 rounded-full ring-3"></div>
		{/each}
	</div>
</ProgressPrimitive.Root>
