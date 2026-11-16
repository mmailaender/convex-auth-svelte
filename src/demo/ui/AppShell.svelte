<!--
	The frame of every demo page: a header with the navigation and the user
	button, the page, and the profile dialog.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import ProfileDialog from '$demo/users/ui/ProfileDialog.svelte';
	import UserButton from '$demo/users/ui/UserButton.svelte';

	let {
		mode,
		signInHref,
		children
	}: {
		/** Which bindings the page runs on. */
		mode: 'sveltekit' | 'spa';
		signInHref: string;
		children: Snippet;
	} = $props();

	const inboxEnabled = useQuery(api.emails.inboxEnabled, () => ({}));

	const links = $derived([
		{ href: '/', label: 'Overview' },
		{ href: '/product', label: 'Chat' },
		{ href: '/spa', label: 'Client-only' },
		...(inboxEnabled.data ? [{ href: '/dev/inbox', label: 'Dev inbox' }] : [])
	]);

	function isActive(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<div class="flex min-h-dvh flex-col">
	<header
		class="border-surface-200-800 bg-surface-50-950/80 sticky top-0 z-40 border-b backdrop-blur"
	>
		<div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
			<a href="/" class="flex items-center gap-2 font-semibold">
				<span class="preset-filled-primary-500 flex size-8 items-center justify-center rounded-lg">
					<ShieldCheckIcon class="size-4.5" />
				</span>
				<span class="hidden sm:inline">Convex Auth</span>
				<span class="badge preset-tonal-surface hidden text-xs sm:inline-flex">
					{mode === 'spa' ? 'Svelte SPA' : 'SvelteKit'}
				</span>
			</a>
			<nav class="mr-auto flex items-center gap-1 overflow-x-auto text-sm">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class={[
							'rounded-base px-2.5 py-1.5 whitespace-nowrap transition-colors',
							isActive(link.href)
								? 'bg-surface-200-800 text-surface-950-50 font-medium'
								: 'text-surface-700-300 hover:bg-surface-100-900'
						]}
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
			<UserButton {signInHref} />
		</div>
	</header>
	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>
</div>

<ProfileDialog />
