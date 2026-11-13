<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { useAuth } from 'convex-svelte';
	import { useAuthActions } from '$lib/svelte/index.svelte';
	import {
		useSignInWithUsernamePassword,
		useSignUpWithUsernamePassword
	} from '$lib/methods/username-password.svelte';
	import { api } from '$lib/convex/_generated/api';

	const auth = useAuth();
	const { signOut } = useAuthActions();
	const login = useSignInWithUsernamePassword(api.auth);
	const signup = useSignUpWithUsernamePassword(api.auth);
	const viewer = useQuery(api.users.viewer, () => (auth.isAuthenticated ? {} : 'skip'));

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const action = (event.submitter as HTMLButtonElement | null)?.value;
		const result =
			action === 'signUp'
				? await signup.signUp({ username, password })
				: await login.signIn({ username, password });
		if (result.status === 'error') {
			error = result.userError.error;
		}
	}
</script>

<main class="mx-auto flex min-h-screen w-80 flex-col justify-center gap-4">
	<h2 class="text-2xl font-semibold tracking-tight">Single-page app</h2>
	{#if auth.isLoading}
		<p>Loading…</p>
	{:else if auth.isAuthenticated}
		<p>Signed in as <strong>{viewer.data?.name ?? '…'}</strong></p>
		<button class="btn preset-tonal" onclick={() => signOut()}>Sign out</button>
	{:else}
		<form class="flex flex-col gap-2" onsubmit={submit}>
			<label class="label">
				<span class="label-text">Username</span>
				<input class="input" autocomplete="username" required bind:value={username} />
			</label>
			<label class="label">
				<span class="label-text">Password</span>
				<input class="input" type="password" required bind:value={password} />
			</label>
			{#if error}<p role="alert" class="text-error-500">{error}</p>{/if}
			<button class="btn preset-filled" value="signIn" disabled={login.pending}>Sign in</button>
			<button class="btn preset-tonal" value="signUp" disabled={signup.pending}>Sign up</button>
		</form>
	{/if}
</main>
