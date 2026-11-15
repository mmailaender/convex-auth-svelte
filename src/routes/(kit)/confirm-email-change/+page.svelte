<!-- Opened from the change-email email. Switches the account to the new address. -->
<script lang="ts">
	import { page } from '$app/state';
	import { useCompleteChangeEmail } from '$lib/methods/email-password.svelte';
	import { api } from '$lib/convex/_generated/api';
	import { authErrorMessage } from '$demo/auth/errors.js';
	import AuthPage from '$demo/ui/AuthPage.svelte';
	import LinkStatus from '$demo/ui/LinkStatus.svelte';

	const change = useCompleteChangeEmail(api.auth, {
		emailCode: page.url.searchParams.get('code') ?? ''
	});
	const link = $derived(change.current);
	const signInHref = $derived(
		`/signin?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`
	);
</script>

<AuthPage>
	{#if link.status === 'loading'}
		<LinkStatus status="loading" title="Confirming your new email address…" />
	{:else if link.status === 'complete'}
		<LinkStatus status="complete" title="Your email address is changed">
			<p class="text-surface-700-300 text-sm">Sign in with your new address from now on.</p>
			<a class="btn preset-filled-primary-500 w-full" href="/?dialog=profile"
				>Back to your account</a
			>
		</LinkStatus>
	{:else}
		<LinkStatus status="error" title="We couldn't change your email address">
			<p class="text-surface-700-300 text-sm">
				{authErrorMessage(link.userError, {
					NOT_LOGGED_IN: 'Sign in first, then open the link again.',
					EMAIL_TAKEN: 'Another account validated this email address first.'
				})}
			</p>
			{#if link.userError.error === 'NOT_LOGGED_IN'}
				<a class="btn preset-filled-primary-500 w-full" href={signInHref}>Sign in</a>
			{:else}
				<a class="btn preset-tonal w-full" href="/?dialog=profile">Back to your account</a>
			{/if}
		</LinkStatus>
	{/if}
</AuthPage>
