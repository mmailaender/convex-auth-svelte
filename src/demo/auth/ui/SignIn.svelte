<!--
	The sign-in card: OAuth providers, then a tab per credential method. One
	toggle switches every method between signing in and creating an account.
-->
<script lang="ts">
	import { useOauth } from '$lib/methods/oauth';
	import * as Tabs from '$demo/primitives/ui/tabs/index.js';
	import Alert from '$demo/primitives/ui/Alert.svelte';
	import { cn } from '$demo/primitives/utils.js';
	import { AUTH_CONFIG } from '../config.js';
	import { authErrorMessage } from '../errors.js';
	import EmailPasswordForm from './EmailPasswordForm.svelte';
	import SocialButtons from './SocialButtons.svelte';
	import UsernamePasswordForm from './UsernamePasswordForm.svelte';
	import PasskeyForm from './PasskeyForm.svelte';

	let {
		mode = $bindable('signIn'),
		redirectTo,
		onsignin,
		methods = AUTH_CONFIG.methods,
		class: className
	}: {
		mode?: 'signIn' | 'signUp';
		/** Where an OAuth flow returns to, as an absolute URL. Defaults to the current page. */
		redirectTo?: string;
		/** Called once a credential method signed the user in. */
		onsignin?: () => void;
		/** The methods to offer. Defaults to `AUTH_CONFIG.methods`. */
		methods?: Partial<Record<keyof typeof AUTH_CONFIG.methods, boolean>>;
		class?: string;
	} = $props();

	const oauth = useOauth();
	let oauthStartError = $state<string | null>(null);
	const oauthError = $derived(
		oauth.flowError ? authErrorMessage(oauth.flowError) : oauthStartError
	);

	const hasSocial = $derived(Boolean(methods.github || methods.google || methods.apple));
	const tabs = $derived(
		[
			methods.emailPassword && { value: 'email', label: 'Email' },
			methods.usernamePassword && { value: 'username', label: 'Username' },
			methods.usernamePasskey && { value: 'passkey', label: 'Passkey' }
		].filter((tab) => typeof tab === 'object')
	);

	// The email form takes over the card while it asks for a reset link or
	// waits for an emailed one.
	let emailView = $state<'form' | 'forgot' | 'validation-sent' | 'recovery-sent'>('form');
	const focused = $derived(emailView !== 'form');

	let selectedTab = $state<string>();
	const tab = $derived(selectedTab ?? tabs[0]?.value);

	const legal = [
		AUTH_CONFIG.termsUrl && { href: AUTH_CONFIG.termsUrl, label: 'Terms' },
		AUTH_CONFIG.privacyUrl && { href: AUTH_CONFIG.privacyUrl, label: 'Privacy Policy' }
	].filter((link) => typeof link === 'object');
</script>

<div class={cn('flex w-full flex-col gap-7', className)}>
	{#if emailView === 'forgot'}
		<header class="flex flex-col gap-1.5">
			<h1 class="h4">Reset your password</h1>
			<p class="text-surface-700-300 text-sm">We'll email you a link to choose a new one.</p>
		</header>
	{:else if !focused}
		<header class="flex flex-col gap-1.5">
			<h1 class="h4">
				{mode === 'signUp' ? 'Create your account' : `Sign in to ${AUTH_CONFIG.brandName}`}
			</h1>
			<p class="text-surface-700-300 text-sm">
				{mode === 'signUp' ? 'Pick how you want to sign in from now on.' : AUTH_CONFIG.tagline}
			</p>
		</header>
	{/if}

	{#if oauthError && !focused}<Alert>{oauthError}</Alert>{/if}

	{#if hasSocial && !focused}
		<SocialButtons {redirectTo} {methods} onerror={(message) => (oauthStartError = message)} />
	{/if}

	{#if hasSocial && tabs.length > 0 && !focused}
		<div class="flex items-center gap-3" role="separator">
			<div class="border-surface-300-700 flex-1 border-t"></div>
			<span class="text-surface-600-400 text-xs">or</span>
			<div class="border-surface-300-700 flex-1 border-t"></div>
		</div>
	{/if}

	{#snippet form(value: string)}
		{#if value === 'email'}
			<EmailPasswordForm bind:mode bind:view={emailView} onsuccess={onsignin} />
		{:else if value === 'username'}
			<UsernamePasswordForm bind:mode onsuccess={onsignin} />
		{:else if value === 'passkey'}
			<PasskeyForm onsuccess={onsignin} />
		{/if}
	{/snippet}

	{#if tabs.length > 1}
		<Tabs.Root value={tab} onValueChange={(details) => (selectedTab = details.value)} class="gap-5">
			{#if !focused}
				<Tabs.List class="bg-surface-100-900 w-full p-1 data-[orientation=horizontal]:w-full">
					{#each tabs as { value, label } (value)}
						<Tabs.Trigger {value} class="btn-sm">{label}</Tabs.Trigger>
					{/each}
				</Tabs.List>
			{/if}
			{#each tabs as { value } (value)}
				<Tabs.Content {value}>{@render form(value)}</Tabs.Content>
			{/each}
		</Tabs.Root>
	{:else if tabs.length === 1}
		{@render form(tabs[0].value)}
	{/if}

	{#if tabs.length > 0 && !focused}
		<p class="text-surface-700-300 text-center text-sm">
			{mode === 'signUp' ? 'Already have an account?' : 'New here?'}
			<button
				type="button"
				class="anchor font-medium"
				onclick={() => (mode = mode === 'signUp' ? 'signIn' : 'signUp')}
			>
				{mode === 'signUp' ? 'Sign in' : 'Create an account'}
			</button>
		</p>
	{/if}

	{#if legal.length > 0}
		<p class="text-surface-600-400 text-xs">
			By continuing, you agree to our
			{#each legal as link, i (link.href)}
				{#if i > 0}and{/if}
				<a class="anchor" href={link.href} rel="external noreferrer">{link.label}</a>
			{/each}.
		</p>
	{/if}
</div>
