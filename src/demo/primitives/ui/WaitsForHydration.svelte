<!--
	Marks the control it wraps as not ready until the page hydrates.

	A server-rendered control that acts only through JavaScript (a popover or dialog trigger,
	a button with an `onclick`) can be pressed before its handler exists, and the press is
	lost. Wrapped, it is announced as unavailable until this component has mounted:
	`aria-disabled` on the wrapper reaches the control in the accessibility tree, and
	Playwright's `click()` waits for it.

	The wrapper is `display: contents` and the attribute sits on it, not on the control, so
	styles for a disabled control (`[aria-disabled='true']`) never match: the control looks
	the same before and after hydration. A link or a form works without JavaScript and needs
	none of this.
-->
<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
</script>

<span class="contents" aria-disabled={hydrated ? undefined : 'true'}>{@render children()}</span>
