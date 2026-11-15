<script lang="ts">
	import '../app.css';
	import { Toaster } from '$demo/primitives/ui/sonner/index.js';

	let { children } = $props();
</script>

<svelte:head>
	<title>Convex Auth for Svelte</title>
</svelte:head>

<Toaster position="top-center" />
{@render children()}
