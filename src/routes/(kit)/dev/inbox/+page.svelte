<!--
	The emails the backend sent while no Resend API key is set. Links to the
	demo's landing pages open on this origin, whatever SITE_URL says.
-->
<script lang="ts">
	import { page } from '$app/state';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	const LANDING_PAGES = ['/validate-email', '/confirm-email-change', '/reset-password'];

	const to = $derived(page.url.searchParams.get('to') ?? undefined);
	const inbox = useQuery(api.emails.inbox, () => ({ to }));

	type Part = { text: string } | { href: string };

	function parts(text: string): Part[] {
		return text.split(/(https?:\/\/\S+)/g).map((chunk, i) => {
			if (i % 2 === 0) return { text: chunk };
			const url = new URL(chunk);
			if (LANDING_PAGES.includes(url.pathname)) {
				return { href: page.url.origin + url.pathname + url.search };
			}
			return { href: chunk };
		});
	}
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
	<header class="flex flex-col gap-2">
		<h1 class="h3">Dev inbox</h1>
		<p class="text-surface-700-300 text-sm">
			With <code class="code">DEV_INBOX=true</code>, the backend keeps the emails of Convex Auth
			here instead of sending them. Anyone can read this page, so never turn it on for real users.
		</p>
		{#if to}
			<p class="text-sm">
				Showing emails to <strong>{to}</strong>.
				<a class="anchor" href="/dev/inbox">Show all</a>
			</p>
		{/if}
	</header>

	{#if inbox.data && !inbox.data.enabled}
		<p class="card preset-tonal p-4 text-sm">
			The dev inbox is off. Emails go through Resend once <code class="code">RESEND_API_KEY</code> is
			set.
		</p>
	{:else if inbox.data?.emails.length === 0}
		<div class="card preset-tonal flex flex-col items-center gap-3 p-10 text-center">
			<InboxIcon class="text-surface-600-400 size-8" />
			<p class="text-sm">No emails yet. Sign up with an email address to get one.</p>
		</div>
	{:else if inbox.data}
		<ul class="flex flex-col gap-3">
			{#each inbox.data.emails as email (email._id)}
				<li class="card border-surface-200-800 flex flex-col gap-3 border p-4" data-testid="email">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h2 class="font-semibold">{email.subject}</h2>
						<time
							class="text-surface-600-400 text-xs"
							datetime={new Date(email._creationTime).toISOString()}
						>
							{new Date(email._creationTime).toLocaleString()}
						</time>
					</div>
					<p class="text-surface-700-300 text-xs">To {email.to}</p>
					<p class="text-sm break-words whitespace-pre-line">
						{#each parts(email.text) as part, i (i)}
							{#if 'href' in part}
								<a class="anchor break-all" href={part.href}>{part.href}</a>
							{:else}
								{part.text}
							{/if}
						{/each}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>
