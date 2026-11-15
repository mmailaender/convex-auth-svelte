<script lang="ts">
	import { page } from '$app/state';
	import AtSignIcon from '@lucide/svelte/icons/at-sign';
	import FingerprintIcon from '@lucide/svelte/icons/fingerprint';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MonitorSmartphoneIcon from '@lucide/svelte/icons/monitor-smartphone';
	import ServerIcon from '@lucide/svelte/icons/server';
	import UserCogIcon from '@lucide/svelte/icons/user-cog';
	import { useAuth, useQuery } from 'convex-svelte';
	import { api } from '$lib/convex/_generated/api';
	import * as Avatar from '$demo/primitives/ui/avatar/index.js';
	import { METHOD_LABELS } from '$demo/auth/config.js';
	import { setProfileDialog } from '$demo/users/ui/profileDialog.js';

	const auth = useAuth();
	const viewer = useQuery(api.users.viewer, () => (auth.isAuthenticated ? {} : 'skip'));

	const features = [
		{
			icon: MailIcon,
			title: 'Email + password',
			text: 'Sign-up validated by an emailed link, password reset, and changing the email address.',
			href: '/signup',
			code: 'src/demo/auth/ui/EmailPasswordForm.svelte'
		},
		{
			icon: AtSignIcon,
			title: 'Username + password',
			text: 'Accounts without an email address, signed in right after sign-up.',
			href: '/signup',
			code: 'src/demo/auth/ui/UsernamePasswordForm.svelte'
		},
		{
			icon: FingerprintIcon,
			title: 'Passkeys',
			text: 'One username field: a new name signs up with a passkey, a known one asks for it. The browser also offers stored passkeys as you type.',
			href: '/signin',
			code: 'src/demo/auth/ui/PasskeyForm.svelte'
		},
		{
			icon: KeyRoundIcon,
			title: 'GitHub, Google and Apple',
			text: 'OAuth through the Convex Auth components. The flow finishes on the page it returns to.',
			href: '/signin',
			code: 'src/demo/auth/ui/SocialButtons.svelte'
		},
		{
			icon: UserCogIcon,
			title: 'Account dialog',
			text: 'Name, avatar, email, password and passkeys, with the sections that fit how the account signs in.',
			href: '/?dialog=profile',
			code: 'src/demo/users/ui/UserProfile.svelte'
		},
		{
			icon: ServerIcon,
			title: 'Server-side rendering',
			text: 'The refresh token stays in an httpOnly cookie. The chat is protected in the handle hook and loaded on the server.',
			href: '/product',
			code: 'src/hooks.server.ts'
		},
		{
			icon: MonitorSmartphoneIcon,
			title: 'Client-only Svelte',
			text: 'The same components on setupConvexAuth, with the tokens in localStorage.',
			href: '/spa',
			code: 'src/routes/spa/+layout.svelte'
		},
		{
			icon: InboxIcon,
			title: 'Dev inbox',
			text: 'Without a Resend API key, the emails of Convex Auth land here, links included.',
			href: '/dev/inbox',
			code: 'src/lib/convex/emails.ts'
		}
	];
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6 sm:py-20">
	<section class="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
		<div class="flex flex-col gap-6">
			<span class="badge preset-tonal-primary w-fit">Convex Auth v2 · Svelte 5</span>
			<h1 class="h1 text-4xl leading-tight sm:text-5xl">
				Authentication for Svelte, in your Convex backend
			</h1>
			<p class="text-surface-700-300 max-w-xl text-lg">
				The reference app of <code class="code">@mmailaender/convex-auth-svelte</code>: every
				sign-in method of Convex Auth v2, with UI you can copy into your app.
			</p>
			<div class="flex flex-wrap gap-3">
				{#if auth.isAuthenticated}
					<button
						class="btn preset-filled-primary-500"
						onclick={() => setProfileDialog(page.url, true)}
					>
						Open your account
					</button>
				{:else}
					<a class="btn preset-filled-primary-500" href="/signup">Create an account</a>
					<a class="btn preset-tonal" href="/signin">Sign in</a>
				{/if}
				<a
					class="btn preset-outlined-surface-300-700"
					href="https://github.com/mmailaender/convex-auth-svelte"
					rel="external noreferrer"
				>
					GitHub
				</a>
			</div>
		</div>

		<div class="card border-surface-200-800 bg-surface-100-900 flex flex-col gap-4 border p-6">
			<span class="text-surface-600-400 text-xs font-medium tracking-wide uppercase">Session</span>
			{#if auth.isLoading}
				<div class="placeholder h-14 w-full animate-pulse"></div>
			{:else if viewer.data}
				<div class="flex items-center gap-4">
					<Avatar.Root class="size-14">
						<Avatar.Image src={viewer.data.image} alt={viewer.data.name} />
						<Avatar.Fallback><Avatar.Marble name={viewer.data.name} /></Avatar.Fallback>
					</Avatar.Root>
					<div class="flex min-w-0 flex-col">
						<span class="truncate font-semibold" data-testid="session-name">{viewer.data.name}</span
						>
						<span class="text-surface-700-300 text-sm">
							Signed in with {METHOD_LABELS[viewer.data.method] ?? viewer.data.method}
						</span>
					</div>
				</div>
			{:else}
				<p class="text-surface-700-300 text-sm" data-testid="session-signed-out">
					You're signed out. Sign in with any method to see your session here.
				</p>
			{/if}
		</div>
	</section>

	<section class="flex flex-col gap-6">
		<h2 class="h4">What's in here</h2>
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each features as feature (feature.title)}
				<li>
					<a
						href={feature.href}
						class="card border-surface-200-800 hover:border-surface-400-600 flex h-full flex-col gap-3 border p-5 transition-colors"
					>
						<feature.icon class="text-primary-600-400 size-5" />
						<h3 class="font-semibold">{feature.title}</h3>
						<p class="text-surface-700-300 flex-1 text-sm">{feature.text}</p>
						<span class="text-surface-600-400 font-mono text-xs break-all">{feature.code}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
