<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	// Icons
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				'flex flex-row rounded-container shadow-lg w-full md:w-96 items-start p-3 transition-all font-medium gap-2 pointer-events-auto',
			title: 'break-words text-sm font-medium leading-tight',
			description: 'text-surface-600-400 mt-1 line-clamp-2 text-xs',
			action: '',
			actionButton: '',
			cancelButton: '',
			closeButton: 'btn hover:preset-tonal ml-auto p-1 text-xs order-last',
			default: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
			info: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
			success: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
			error: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
			loading: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
			warning: 'bg-surface-950 dark:bg-surface-800 text-surface-50'
		}
	}}
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="flex-shrink-0 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="text-success-500 flex-shrink-0" />
	{/snippet}
	{#snippet errorIcon()}
		<CircleXIcon class="text-error-500 flex-shrink-0" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="flex-shrink-0" />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangleIcon class="flex-shrink-0" />
	{/snippet}
</Sonner>

<style>
	:global(.sonner-loader) {
		position: static !important;
		transform: none !important;
	}
</style>
