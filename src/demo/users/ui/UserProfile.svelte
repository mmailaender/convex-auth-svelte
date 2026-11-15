<!--
	The account page of the signed-in user. Which sections appear depends on
	how the account signs in: every account has exactly one sign-in method.
-->
<script lang="ts">
	import SiApple from '@icons-pack/svelte-simple-icons/icons/SiApple';
	import SiGithub from '@icons-pack/svelte-simple-icons/icons/SiGithub';
	import SiGoogle from '@icons-pack/svelte-simple-icons/icons/SiGoogle';
	import { METHOD_LABELS, hasPassword } from '$demo/auth/config.js';
	import SignOutButton from '$demo/auth/ui/SignOutButton.svelte';
	import ChangeEmail from './ChangeEmail.svelte';
	import ChangePassword from './ChangePassword.svelte';
	import Passkeys from './Passkeys.svelte';
	import ProfileInfo from './ProfileInfo.svelte';
	import type { Viewer } from './viewer.js';

	let { viewer, onsignout }: { viewer: Viewer; onsignout?: () => void } = $props();

	const providerIcons: Record<string, typeof SiGithub> = {
		github: SiGithub,
		google: SiGoogle,
		apple: SiApple
	};
	const ProviderIcon = $derived(providerIcons[viewer.method]);
</script>

{#snippet section(title: string, description: string)}
	<div class="flex flex-col gap-0.5">
		<h3 class="text-sm font-semibold">{title}</h3>
		<p class="text-surface-600-400 text-xs">{description}</p>
	</div>
{/snippet}

<div class="flex w-full flex-col gap-8">
	<section class="flex flex-col gap-4">
		{@render section('Profile', 'How other people see you in the app.')}
		<ProfileInfo {viewer} />
	</section>

	<section class="flex flex-col gap-4">
		{@render section(
			'Sign-in',
			`You sign in with ${METHOD_LABELS[viewer.method] ?? viewer.method}.`
		)}
		<div class="flex flex-col gap-3">
			{#if viewer.method === 'emailPassword'}
				<ChangeEmail {viewer} />
			{:else if viewer.method === 'usernamePassword' || viewer.method === 'usernamePasskey'}
				<div class="border-surface-300-700 rounded-container border px-3.5 py-2">
					<span class="text-surface-600-400 text-xs">Username</span>
					<p class="text-sm" data-testid="profile-username">{viewer.username}</p>
				</div>
			{:else if ProviderIcon}
				<div
					class="border-surface-300-700 rounded-container flex items-center gap-3 border px-3.5 py-2.5"
				>
					<ProviderIcon size={18} />
					<div class="flex min-w-0 flex-col">
						<span class="text-sm">{METHOD_LABELS[viewer.method]}</span>
						{#if viewer.githubLogin}
							<span class="text-surface-600-400 truncate text-xs">@{viewer.githubLogin}</span>
						{/if}
					</div>
					<span class="badge preset-tonal-success ml-auto text-xs">Connected</span>
				</div>
			{/if}
			{#if hasPassword(viewer.method)}
				<ChangePassword {viewer} />
			{/if}
		</div>
	</section>

	{#if viewer.method === 'usernamePasskey'}
		<section class="flex flex-col gap-4">
			{@render section(
				'Passkeys',
				'Sign in with any of these. Keep more than one, in case you lose a device.'
			)}
			<Passkeys />
		</section>
	{/if}

	<section class="border-surface-300-700 flex items-center justify-between gap-4 border-t pt-6">
		{@render section('Session', 'Sign out of this browser.')}
		<SignOutButton class="btn preset-tonal" {onsignout} />
	</section>
</div>
