<!--
	The profile dialog. It's open while the URL has `?dialog=profile`, so it
	survives a reload and other pages can link to it.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { useAuth, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import * as Dialog from '$demo/primitives/ui/dialog/index.js';
	import UserProfile from './UserProfile.svelte';
	import { PROFILE_DIALOG, setProfileDialog } from './profileDialog.js';

	const auth = useAuth();
	const viewer = useQuery(api.users.viewer, () => (auth.isAuthenticated ? {} : 'skip'));

	const open = $derived(page.url.searchParams.get('dialog') === PROFILE_DIALOG);
</script>

{#if auth.isAuthenticated && viewer.data}
	<Dialog.Root
		{open}
		onOpenChange={(details) => {
			if (!details.open) void setProfileDialog(page.url, false);
		}}
	>
		<Dialog.Content
			class="md:rounded-container top-0 left-0 h-full max-h-dvh w-full max-w-full translate-x-0 translate-y-0 gap-0 rounded-none p-0 md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90vh] md:w-[560px] md:-translate-x-1/2 md:-translate-y-1/2"
		>
			<Dialog.Header class="border-surface-300-700 w-full border-b px-6 py-4">
				<Dialog.Title>Account</Dialog.Title>
			</Dialog.Header>
			<div class="w-full overflow-y-auto overscroll-contain p-6">
				<UserProfile
					viewer={viewer.data}
					onsignout={() => void setProfileDialog(page.url, false)}
				/>
			</div>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
{/if}
