/**
 * The building blocks of the passkey helpers: the autofill request loop of
 * a sign-in page, and the slot that runs one modal ceremony at a time.
 *
 * Adapted from `@convex-dev/auth` v2
 * (`src/methods/username-passkey/react_impl.tsx`), Copyright Convex, Inc.,
 * licensed under the Apache License 2.0. Upstream's `usePasskeyAutofill`
 * and `usePasskeyCeremonySlot` are React hooks; here they're rewritten with
 * runes. The loop starts in an `$effect`, so it runs while the component is
 * mounted and aborts its request when the component is destroyed, like
 * upstream's `useEffect`.
 *
 * @module
 */
import { untrack } from 'svelte';
import {
	foldClientError,
	type PasskeyClientError,
	type PasskeyClientFailure,
	type ResolvedPasskeyCeremonies
} from './ceremonies.js';
import type { WireAuthenticationResponse, WireRequestOptions } from './types.js';

/**
 * The states of the autofill flow:
 *
 * - `"idle"`: the flow has not started yet.
 * - `"waiting"`: the autofill request is pending in the browser.
 * - `"signingIn"`: the server verifies the passkey the user picked.
 * - `"signedIn"`: the autofill sign-in succeeded and the flow is done.
 * - `"stopped"`: the flow is done without a success (failure, or no
 *   browser support).
 */
export type PasskeyAutofillStatus = 'idle' | 'waiting' | 'signingIn' | 'signedIn' | 'stopped';

/**
 * The gates of an autofill flow. The browser runs one WebAuthn ceremony at a
 * time per page, so every modal ceremony on a page that runs autofill pauses
 * the flow around itself. Pauses are reference-counted, so two modal flows
 * compose. `isAutofillSigningIn()` tells whether the server verifies a picked
 * passkey: a pause can't stop that step, so a modal flow must not start
 * during it.
 */
export type PasskeyAutofillGates = {
	pauseAutofillFlow: () => void;
	resumeAutofillFlow: () => void;
	isAutofillSigningIn: () => boolean;
};

// How long a stored challenge stays valid on the server. The same value as
// `CHALLENGE_TTL_MS` of upstream's passkey component, which isn't exported.
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

// A pending autofill request refreshes its challenge two minutes before the
// server's challenge TTL expires, so the challenge that the user finally
// redeems is never expired.
const AUTOFILL_REFRESH_MS = CHALLENGE_TTL_MS - 2 * 60 * 1000;

// How often a pending request compares the age of its challenge against
// `AUTOFILL_REFRESH_MS`. The age is wall-clock time, which a single long
// timer doesn't track: browsers throttle timers in background tabs, and
// timers don't advance while the computer sleeps.
const AUTOFILL_STALENESS_CHECK_MS = 10 * 1000;

// After this many failed autofill assertions in a row, the flow stops
// instead of asking the browser again.
const MAX_AUTOFILL_FAILURES = 3;

const FOREIGN_CEREMONY_WARNING =
	'[convex-auth-svelte] The passkey autofill request was ended by another WebAuthn ' +
	'ceremony, so autofill has stopped. A page that runs passkey autofill must ' +
	'run every one of its modal ceremonies through the passkey helpers, so that ' +
	"autofill yields the browser's single ceremony slot instead of competing for it.";

/**
 * Run passkey autofill (conditional mediation) while the calling component
 * is mounted. Call during component initialization. The page must render an
 * `<input autocomplete="… webauthn">` for the browser to offer the passkeys.
 */
export function createPasskeyAutofill<E>(options: {
	ceremonies: ResolvedPasskeyCeremonies;
	/** Mint fresh request options, with a fresh challenge. */
	start: () => Promise<WireRequestOptions>;
	/**
	 * Handle the assertion of the passkey the user picked. Return
	 * `success: false` to make the loop retry with a fresh challenge (up to a
	 * small cap), `success: true` to end the flow as `"signedIn"`.
	 */
	onAssertion: (
		response: WireAuthenticationResponse
	) => Promise<{ success: true } | { success: false; userError: E }>;
}) {
	const { ceremonies } = options;

	let available = $state<boolean | null>(null);
	let status = $state<PasskeyAutofillStatus>('idle');
	let lastError = $state<E | PasskeyClientError | null>(null);

	// Plain variables, not state: the loop reads them, nothing renders them.
	// The pause count lives on the helper, so a pause holds across a restart
	// of the effect.
	let pauseCount = 0;
	// Wakes the parked loop; `null` while the loop isn't parked.
	let wake: (() => void) | null = null;
	// The controller of the conditional request in flight. Only this helper
	// aborts it, so an abort is never another ceremony taking the slot.
	let controller: AbortController | null = null;
	// `true` while `onAssertion` runs. Not `status`, so that a modal flow
	// started in the same tick as the pick sees it.
	let signingIn = false;

	const gates: PasskeyAutofillGates = {
		pauseAutofillFlow() {
			pauseCount += 1;
			controller?.abort();
		},
		resumeAutofillFlow() {
			pauseCount = Math.max(0, pauseCount - 1);
			if (pauseCount === 0) {
				wake?.();
			}
		},
		isAutofillSigningIn: () => signingIn
	};

	$effect(() => {
		// The cleanup flips this; the loop exits after its next await.
		let alive = true;

		const park = () =>
			new Promise<void>((resolve) => {
				wake = () => {
					wake = null;
					resolve();
				};
			});

		const runLoop = async () => {
			// `isAutofillAvailable` never rejects; count a rejection as "not
			// available" anyway, so the flow can't stay on `available: null`.
			const supported = await ceremonies.isAutofillAvailable().catch(() => false);
			if (!alive) {
				return;
			}
			available = supported;
			if (!supported) {
				status = 'stopped';
				return;
			}

			let failures = 0;
			while (alive) {
				if (pauseCount > 0) {
					await park();
					continue;
				}

				status = 'waiting';
				// Taken before the start mutation runs, so the age this loop
				// measures is never shorter than the age the server measures.
				const requestedAt = Date.now();
				let requestOptions: WireRequestOptions;
				try {
					requestOptions = await options.start();
				} catch (cause) {
					if (!alive) {
						return;
					}
					lastError = foldClientError(cause);
					status = 'stopped';
					return;
				}
				if (!alive) {
					return;
				}
				if (pauseCount > 0) {
					// A pause came in while the challenge was minted: park before
					// a browser request starts.
					continue;
				}

				// Nothing yields between the gate check above and this line, so no
				// pause lands in between. An `AbortSignal` latches, and `get()`
				// refuses an already-aborted signal, so a pause from here on aborts
				// the request whenever it arrives.
				const current = new AbortController();
				controller = current;

				const refreshIfStale = () => {
					if (Date.now() - requestedAt >= AUTOFILL_REFRESH_MS) {
						current.abort();
					}
				};
				const refreshTimer = setInterval(refreshIfStale, AUTOFILL_STALENESS_CHECK_MS);
				const stopResumeChecks = ceremonies.onResume(refreshIfStale);

				const result = await ceremonies.authenticateWithAutofill(requestOptions, current.signal);
				if (controller === current) {
					controller = null;
				}
				clearInterval(refreshTimer);
				stopResumeChecks();
				if (!alive) {
					return;
				}

				if (!result.success) {
					if (current.signal.aborted) {
						// This helper ended its own request (a refresh or a pause). The
						// top of the loop parks if a pause is owed, and otherwise starts
						// a request with a fresh challenge.
						continue;
					}
					// Another WebAuthn ceremony took the browser's slot, or the
					// browser refuses conditional requests. Starting a new request
					// would abort whatever holds the slot, so the flow stops.
					if (result.userError.error === 'CEREMONY_ABORTED') {
						console.warn(FOREIGN_CEREMONY_WARNING);
					}
					lastError = result.userError;
					status = 'stopped';
					return;
				}

				status = 'signingIn';
				signingIn = true;
				let outcome: Awaited<ReturnType<typeof options.onAssertion>>;
				try {
					outcome = await options.onAssertion(result.response);
				} catch (cause) {
					if (!alive) {
						return;
					}
					lastError = foldClientError(cause);
					status = 'stopped';
					return;
				} finally {
					signingIn = false;
				}
				if (!alive) {
					return;
				}
				if (outcome.success) {
					lastError = null;
					status = 'signedIn';
					return;
				}
				lastError = outcome.userError;
				failures += 1;
				if (failures >= MAX_AUTOFILL_FAILURES) {
					status = 'stopped';
					return;
				}
				// Try again with a fresh challenge.
			}
		};

		// The loop writes state, and must not make the effect depend on it.
		untrack(() => void runLoop());

		return () => {
			alive = false;
			controller?.abort();
			// Never leave the loop parked; it exits on `alive`.
			wake?.();
		};
	});

	return {
		...gates,
		/** Whether the browser can offer passkeys in the autocompletion list; `null` while detection runs. */
		get available() {
			return available;
		},
		/** The state of the request. */
		get status() {
			return status;
		},
		/** The most recent failure, for display or logging. */
		get lastError() {
			return lastError;
		}
	};
}

/**
 * A call on a flow whose previous call still runs. The first call keeps its
 * browser dialog and resolves as usual, so a caller that gets this shows
 * nothing.
 */
export type AlreadyPendingError = { error: 'ALREADY_PENDING' };

/** Failure shape for {@link AlreadyPendingError}. */
export type AlreadyPendingFailure = {
	success: false;
	userError: AlreadyPendingError;
};

/**
 * Run one modal ceremony at a time. `run(fn)`:
 *
 * - refuses a call while another runs, or while the server verifies an
 *   autofill sign-in, with an {@link AlreadyPendingFailure};
 * - pauses the page's autofill flow, if any, around `fn`;
 * - folds anything `fn` throws into a `PasskeyClientFailure`.
 *
 * Call during component initialization.
 */
export function createCeremonySlot(autofill: PasskeyAutofillGates | null) {
	let pending = $state(false);

	async function run<T>(
		fn: () => Promise<T>
	): Promise<T | PasskeyClientFailure | AlreadyPendingFailure> {
		if (pending || autofill?.isAutofillSigningIn()) {
			return { success: false, userError: { error: 'ALREADY_PENDING' } };
		}
		pending = true;
		autofill?.pauseAutofillFlow();
		try {
			return await fn();
		} catch (cause) {
			return { success: false, userError: foldClientError(cause) };
		} finally {
			autofill?.resumeAutofillFlow();
			pending = false;
		}
	}

	return {
		run,
		/** `true` while a `run` call is running. */
		get pending() {
			return pending;
		}
	};
}
