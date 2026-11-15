// Password strength checking that keeps zxcvbn out of the server bundle.
// The checker and its word lists (about 1.7 MB) are imported on demand, in the browser only:
// during SSR the password is empty and the strength meter shows its empty state.
import type { ZxcvbnResult } from '@zxcvbn-ts/core';

/** Scores a password from 0 (weakest) to 4. */
export type PasswordChecker = {
	check: (password: string) => ZxcvbnResult;
};

export type PasswordCheckerLoader = {
	/**
	 * Starts loading on the first call and returns that same promise to every later call, so a page
	 * loads the checker once. A failed load is forgotten, so the next call tries again.
	 */
	load: () => Promise<PasswordChecker>;
	/** The checker once it has loaded, so a field that mounts later scores at once. */
	loaded: () => PasswordChecker | null;
};

export function createPasswordCheckerLoader(
	importChecker: () => Promise<PasswordChecker>
): PasswordCheckerLoader {
	let checker: PasswordChecker | null = null;
	let loading: Promise<PasswordChecker> | null = null;

	return {
		load() {
			loading ??= importChecker().then(
				(loaded) => (checker = loaded),
				(error: unknown) => {
					loading = null;
					throw error;
				}
			);
			return loading;
		},
		loaded: () => checker
	};
}

export const CHECKING_STRENGTH_MESSAGE = 'Checking password strength…';
export const TOO_WEAK_MESSAGE = 'Password is too weak';

/**
 * The custom validity message of a password field, empty when the field is valid.
 *
 * `score` is null while the checker loads. A password stays invalid until it has a score, so a weak
 * one never passes because the checker wasn't there yet. An empty password is left to `required`.
 */
export function passwordValidityMessage(
	password: string,
	minScore: number,
	score: number | null
): string {
	if (password === '' || minScore <= 0) return '';
	if (score === null) return CHECKING_STRENGTH_MESSAGE;
	return score < minScore ? TOO_WEAK_MESSAGE : '';
}

/** The accessible name of the strength meter. */
export const PASSWORD_STRENGTH_LABEL = 'Password strength';

/**
 * What the strength meter announces for a score, in the words its colours stand for. None while the
 * password is empty or the checker loads, so the meter doesn't call a password weak before it has
 * one or a score.
 */
export function passwordStrengthText(password: string, score: number | null): string | undefined {
	if (password === '' || score === null) return undefined;
	if (score <= 1) return 'Weak';
	if (score === 2) return 'Fair';
	if (score === 3) return 'Good';
	return 'Strong';
}
