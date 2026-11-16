<!-- Opened from the sign-up email. Validates the address and signs the user in. -->
<script lang="ts">
	import { page } from '$app/state';
	import { useCompleteSignUpWithEmailPassword } from '$lib/methods/email-password.svelte';
	import { api } from '$convex/_generated/api';
	import { authErrorMessage } from '$demo/auth/errors.js';
	import AuthPage from '$demo/ui/AuthPage.svelte';
	import LinkStatus from '$demo/ui/LinkStatus.svelte';

	const signUp = useCompleteSignUpWithEmailPassword(api.auth, {
		emailCode: page.url.searchParams.get('code') ?? ''
	});
	const link = $derived(signUp.current);
</script>

<AuthPage>
	{#if link.status === 'loading'}
		<LinkStatus status="loading" title="Validating your email…" />
	{:else if link.status === 'complete'}
		<LinkStatus status="complete" title="Your email is validated">
			<p class="text-surface-700-300 text-sm">Your account is ready, and you're signed in.</p>
			<a class="btn preset-filled-primary-500 w-full" href="/">Continue</a>
		</LinkStatus>
	{:else}
		<LinkStatus
			status="error"
			title={link.userError.error === 'MISSING_SECRET'
				? 'Open this link in the browser you signed up from'
				: "We couldn't validate your email"}
		>
			<p class="text-surface-700-300 text-sm">
				{authErrorMessage(link.userError, {
					EMAIL_TAKEN: 'Another account validated this email address first.'
				})}
			</p>
			<a class="btn preset-tonal w-full" href="/signup">Sign up again</a>
		</LinkStatus>
	{/if}
</AuthPage>
