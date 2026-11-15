<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from '$demo/primitives/ui/sonner/index.js';

	let { children } = $props();

	// Lets the e2e tests wait until the page reacts to clicks.
	onMount(() => {
		document.documentElement.dataset.hydrated = '';
	});
</script>

<svelte:head>
	<title>Convex Auth for Svelte</title>
</svelte:head>

<Toaster position="top-center" />
{@render children()}
