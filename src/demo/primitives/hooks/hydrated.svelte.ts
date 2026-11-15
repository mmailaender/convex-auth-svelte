import { onMount } from 'svelte';

/**
 * Whether the component has hydrated. Disable a form's submit button until
 * then: a form submitted before its handler exists would fall back to a
 * native GET submit and put the password in the URL.
 */
export function useHydrated(): { readonly current: boolean } {
	let hydrated = $state(false);
	onMount(() => {
		hydrated = true;
	});
	return {
		get current() {
			return hydrated;
		}
	};
}
