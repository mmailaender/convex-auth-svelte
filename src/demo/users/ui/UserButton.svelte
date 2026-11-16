<!--
	The avatar of the signed-in user, opening a menu with the account and sign
	out. Signed out, a link to the sign-in page.
-->
<script lang="ts">
	import { page } from '$app/state';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { useAuth, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import * as Avatar from '$demo/primitives/ui/avatar/index.js';
	import * as Popover from '$demo/primitives/ui/popover/index.js';
	import WaitsForHydration from '$demo/primitives/ui/WaitsForHydration.svelte';
	import SignOutButton from '$demo/auth/ui/SignOutButton.svelte';
	import { setProfileDialog } from './profileDialog.js';
	import { viewerIdentifier } from './viewer.js';

	let { signInHref = '/signin' }: { signInHref?: string } = $props();

	const auth = useAuth();
	const viewer = useQuery(api.users.viewer, () => (auth.isAuthenticated ? {} : 'skip'));

	let open = $state(false);

	const signInLink = $derived(
		`${signInHref}?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);
</script>

{#if auth.isAuthenticated && viewer.data}
	{@const user = viewer.data}
	<Popover.Root bind:open positioning={{ placement: 'bottom-end', offset: { mainAxis: 8 } }}>
		<WaitsForHydration>
			<Popover.Trigger
				class="flex size-10 items-center justify-center rounded-full"
				aria-label="Open account menu"
			>
				<Avatar.Root
					class="ring-surface-200-800 size-9 ring-0 transition-[box-shadow] hover:ring-4"
				>
					<Avatar.Image src={user.image} alt={user.name} />
					<Avatar.Fallback><Avatar.Marble name={user.name} /></Avatar.Fallback>
				</Avatar.Root>
			</Popover.Trigger>
		</WaitsForHydration>
		<Popover.Content class="w-72">
			<div class="flex flex-col gap-1">
				<button
					type="button"
					class="bg-surface-50-950 hover:bg-surface-100-900 rounded-container flex items-center gap-3 p-3 text-left transition-colors"
					onclick={() => {
						open = false;
						void setProfileDialog(page.url, true);
					}}
				>
					<Avatar.Root class="size-11">
						<Avatar.Image src={user.image} alt={user.name} />
						<Avatar.Fallback><Avatar.Marble name={user.name} /></Avatar.Fallback>
					</Avatar.Root>
					<div class="flex min-w-0 flex-1 flex-col">
						<span class="truncate text-sm font-medium">{user.name}</span>
						<span class="truncate text-xs opacity-75">{viewerIdentifier(user)}</span>
					</div>
					<ChevronRightIcon class="size-4 shrink-0" />
				</button>
				<SignOutButton
					class="hover:bg-surface-300-700 h-10 justify-start"
					onsignout={() => (open = false)}
				/>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else if auth.isLoading || auth.isAuthenticated}
	<div class="flex size-10 items-center justify-center">
		<div class="placeholder-circle size-9 animate-pulse"></div>
	</div>
{:else}
	<a class="btn preset-filled-primary-500" href={signInLink}>Sign in</a>
{/if}
