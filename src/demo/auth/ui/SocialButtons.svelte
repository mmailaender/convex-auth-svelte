<!--
	One button per OAuth provider. Each starts the provider's flow, which leaves
	the page; the flow finishes on the page it returns to (`redirectTo`).
-->
<script lang="ts">
	import SiApple from '@icons-pack/svelte-simple-icons/icons/SiApple';
	import SiGithub from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import SiGoogle from '@icons-pack/svelte-simple-icons/icons/SiGoogle';
	import { useSignInWithApple } from '$lib/methods/apple';
	import { useSignInWithGithub } from '$lib/methods/github';
	import { useSignInWithGoogle } from '$lib/methods/google';
	import { api } from '$lib/convex/_generated/api';
	import Spinner from '$demo/primitives/ui/Spinner.svelte';
	import { AUTH_CONFIG } from '../config.js';
	import { authErrorMessage } from '../errors.js';

	let {
		redirectTo,
		disabled = false,
		methods = AUTH_CONFIG.methods,
		onerror
	}: {
		/** Where the flow returns to, as an absolute URL. Defaults to the current page. */
		redirectTo?: string;
		disabled?: boolean;
		methods?: Partial<Record<keyof typeof AUTH_CONFIG.methods, boolean>>;
		onerror?: (message: string) => void;
	} = $props();

	const github = useSignInWithGithub(api.auth);
	const google = useSignInWithGoogle(api.auth);
	const apple = useSignInWithApple(api.auth);

	const allProviders = [
		{ id: 'github', label: 'GitHub', Icon: SiGithub, client: github },
		{ id: 'google', label: 'Google', Icon: SiGoogle, client: google },
		{ id: 'apple', label: 'Apple', Icon: SiApple, client: apple }
	] as const;
	const providers = $derived(allProviders.filter(({ id }) => methods[id]));

	let starting = $state<string | null>(null);

	async function signIn(provider: (typeof allProviders)[number]) {
		starting = provider.id;
		const result = await provider.client.signIn(redirectTo ? { redirectTo } : undefined);
		// On success the browser is already on its way to the provider.
		if (result.status === 'error') {
			starting = null;
			onerror?.(authErrorMessage(result.userError));
		}
	}
</script>

{#if providers.length > 0}
	<div class="flex flex-col gap-2.5">
		{#each providers as provider (provider.id)}
			<button
				type="button"
				class="btn preset-outlined-surface-300-700 hover:preset-tonal w-full gap-2.5"
				disabled={disabled || starting !== null}
				aria-busy={starting === provider.id}
				onclick={() => signIn(provider)}
			>
				{#if starting === provider.id}
					<Spinner />
				{:else}
					<provider.Icon size={16} />
				{/if}
				Continue with {provider.label}
			</button>
		{/each}
	</div>
{/if}
