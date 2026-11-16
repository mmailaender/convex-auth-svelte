<!--
	Shown after an email with a link went out. Without a Resend API key the
	demo keeps emails in its dev inbox, so the panel links there.
-->
<script lang="ts">
	import MailIcon from '@lucide/svelte/icons/mail';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	let {
		email,
		title = 'Check your email',
		message,
		onback,
		backLabel = 'Back to sign in'
	}: {
		email: string;
		title?: string;
		message: string;
		onback?: () => void;
		backLabel?: string;
	} = $props();

	const inbox = useQuery(api.emails.inbox, () => ({ to: email }));
</script>

<div class="flex flex-col gap-5" data-testid="check-inbox">
	<div class="bg-surface-200-800 flex size-14 items-center justify-center rounded-full">
		<MailIcon class="text-surface-700-300 size-7" />
	</div>
	<div class="flex flex-col gap-2">
		<h2 class="h5">{title}</h2>
		<p class="text-surface-700-300 text-sm">
			We sent a link to <strong class="text-surface-950-50">{email}</strong>. {message}
		</p>
		<p class="text-surface-600-400 text-xs">
			The link only works in this browser, and it expires after a few minutes.
		</p>
	</div>
	{#if inbox.data?.enabled}
		<a
			class="btn preset-tonal-primary w-full"
			href={`/dev/inbox?to=${encodeURIComponent(email)}`}
			target="_blank"
		>
			Open the dev inbox
		</a>
	{/if}
	{#if onback}
		<button type="button" class="btn preset-tonal w-full" onclick={onback}>{backLabel}</button>
	{/if}
</div>
