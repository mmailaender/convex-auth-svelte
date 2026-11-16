<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useAuth } from 'convex-svelte';
	import { useSignInWithUsernamePassword } from '$lib/methods/username-password.svelte';
	import { useOauth, useSignInWithGithub } from '$lib/methods/github';
	import { api } from '$convex/_generated/api';

	const auth = useAuth();
	const login = useSignInWithUsernamePassword(api.auth);
	const github = useSignInWithGithub(api.auth);
	const oauth = useOauth();

	const redirectTo = $derived(page.url.searchParams.get('redirectTo') ?? '/product');

	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let githubError = $state<string | null>(null);

	// A GitHub sign-in finishes on this page after the redirect back, with no
	// submit handler to navigate, so move on once the session is in place.
	$effect(() => {
		if (auth.isAuthenticated) void goto(redirectTo);
	});

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		const result = await login.signIn({ username, password });
		if (result.status === 'complete') {
			await goto(redirectTo);
			return;
		}
		switch (result.userError.error) {
			case 'USER_NOT_FOUND':
				error = 'No account exists with that username.';
				break;
			case 'INVALID_CREDENTIALS':
				error = 'Incorrect username or password.';
				break;
			case 'RATE_LIMITED':
				error = `Too many attempts. Try again in ${Math.ceil(result.userError.retryAfterMs / 1000)} seconds.`;
				break;
			case 'OTHER_ERROR':
				console.error('Sign-in failed:', result.userError.cause);
				error = 'Something went wrong. Please try again.';
				break;
			default:
				error = 'Incorrect username or password.';
		}
	}

	async function signInWithGithub() {
		githubError = null;
		const result = await github.signIn();
		if (result.status === 'error') {
			console.error('GitHub sign-in failed to start:', result.userError.cause);
			githubError = "Couldn't start GitHub sign-in. Please try again.";
		}
	}

	const flowErrorMessage = $derived.by(() => {
		switch (oauth.flowError?.error) {
			case undefined:
				return null;
			case 'ACCESS_DENIED':
				return 'Sign-in was cancelled.';
			case 'EXPIRED':
				return 'That sign-in took too long. Please try again.';
			case 'INVALID_FLOW':
				return "This sign-in can't be completed here. Please try again.";
			default:
				return 'Something went wrong during sign-in. Please try again.';
		}
	});
</script>

<div class="flex min-h-screen w-full">
	<main class="mx-auto my-auto flex w-80 flex-col gap-4">
		<h2 class="text-2xl font-semibold tracking-tight">Sign in</h2>
		<form class="flex flex-col gap-2" {onsubmit}>
			<label class="label">
				<span class="label-text">Username</span>
				<input
					id="username"
					name="username"
					class="input"
					autocomplete="username"
					required
					bind:value={username}
					disabled={login.pending}
				/>
			</label>
			<label class="label">
				<span class="label-text">Password</span>
				<input
					id="password"
					name="password"
					type="password"
					class="input"
					autocomplete="current-password"
					required
					bind:value={password}
					disabled={login.pending}
				/>
			</label>
			{#if error}<p role="alert" class="text-error-500">{error}</p>{/if}
			<button class="btn preset-filled" type="submit" disabled={login.pending || auth.isLoading}>
				{login.pending ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
		<a class="anchor" href="/signup">Create an account</a>
		<hr class="hr" />
		<button class="btn preset-tonal" onclick={signInWithGithub} disabled={auth.isLoading}>
			Continue with GitHub
		</button>
		{#if githubError}<p role="alert" class="text-error-500">{githubError}</p>{/if}
		{#if flowErrorMessage}<p role="alert" class="text-error-500">{flowErrorMessage}</p>{/if}
		<a class="anchor" href="/">Cancel</a>
	</main>
</div>
