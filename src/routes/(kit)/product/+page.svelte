<script lang="ts">
	import { api } from '$convex/_generated/api';
	import Chat from '$demo/Chat/Chat.svelte';
	import ChatIntro from '$demo/Chat/ChatIntro.svelte';
	import { useQuery } from 'convex-svelte';

	let { data } = $props();

	// Rendered on the server from the load function, then kept live.
	const viewer = useQuery(api.users.viewer, {}, () => ({ initialData: data.viewer }));
</script>

{#if viewer.data}
	<!-- As tall as the viewport below the header (h-16 plus its border), so
	     the message list scrolls and the composer stays in view. -->
	<div class="mx-auto flex h-[calc(100dvh-4rem-1px)] w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
		<div
			class="border-surface-200-800 rounded-container flex min-h-0 flex-1 flex-col overflow-hidden border"
		>
			<div class="border-surface-200-800 border-b p-4">
				<ChatIntro />
			</div>
			<Chat viewerId={viewer.data._id} initialMessages={data.messages} />
		</div>
	</div>
{/if}
