<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	interface Props {
		successMessage?: string;
		errorMessage?: string;
	}

	let { successMessage = $bindable(''), errorMessage = $bindable('') }: Props = $props();

	function clearSuccess() {
		successMessage = '';
	}
	function clearError() {
		errorMessage = '';
	}
</script>

{#if successMessage}
	<div
		class="card preset-outlined-success-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[1fr_auto]"
	>
		<div>
			<p class="font-bold">Success</p>
			<p class="text-xs opacity-60">{successMessage}</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled" onclick={clearSuccess}> Dismiss </button>
		</div>
	</div>
{/if}

{#if errorMessage}
	<div
		class="card preset-outlined-error-500 grid grid-cols-1 items-center gap-4 p-4 lg:grid-cols-[auto_1fr_auto]"
	>
		<TriangleAlertIcon />
		<div>
			<p class="font-bold">Error</p>
			<p class="text-xs opacity-60">{errorMessage}</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled" onclick={clearError}> Dismiss </button>
		</div>
	</div>
{/if}
