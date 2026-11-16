import { untrack } from 'svelte';
import { Context, watch } from 'runed';
import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';
import {
	createPasswordCheckerLoader,
	passwordStrengthText,
	passwordValidityMessage,
	type PasswordChecker
} from '$demo/primitives/utils/passwordStrength.js';

// One checker per page, imported in the browser only. `import.meta.env.SSR` is a build-time
// constant, so the server build drops this `import()` and zxcvbn with it.
const checkerLoader = createPasswordCheckerLoader(async () => {
	if (!import.meta.env.SSR) {
		const { passwordChecker } = await import('$demo/primitives/utils/passwordChecker.js');
		return passwordChecker;
	}
	throw new Error('The password strength checker loads in the browser only');
});

type PasswordRootStateProps = WritableBoxedValues<{
	hidden: boolean;
}> &
	ReadableBoxedValues<{
		minScore: number;
	}>;

type PasswordState = {
	value: string;
	copyMounted: boolean;
	toggleMounted: boolean;
	strengthMounted: boolean;
	submitted: boolean;
	inputRef: HTMLInputElement | null;
	/**
	 * The input's custom validity message. What derives from `validity` reads it, so it updates
	 * when the input applies a new message, for example once the checker loads after a submit.
	 */
	validityMessage: string;
};

const defaultPasswordState: PasswordState = {
	value: '',
	copyMounted: false,
	toggleMounted: false,
	strengthMounted: false,
	submitted: false,
	inputRef: null,
	validityMessage: ''
};

class PasswordRootState {
	passwordState = $state(defaultPasswordState);

	// Null until the checker has loaded, and always during SSR
	checker = $state.raw<PasswordChecker | null>(checkerLoader.loaded());

	constructor(readonly opts: PasswordRootStateProps) {
		// Load the checker as soon as the meter mounts, so it is usually ready before the first
		// keystroke. Reading the value makes typing retry a load that failed.
		$effect(() => {
			if (!this.passwordState.strengthMounted || this.checker) return;
			void this.passwordState.value;
			checkerLoader.load().then(
				(checker) => (this.checker = checker),
				(error: unknown) => console.error('Could not load the password strength checker:', error)
			);
		});
	}

	// only re-run when the password or the checker changes; null while the checker loads
	strength = $derived.by(() => this.checker?.check(this.passwordState.value) ?? null);
	score = $derived(this.strength?.score ?? 0);
}

type PasswordInputStateProps = WritableBoxedValues<{
	value: string;
}> &
	ReadableBoxedValues<{
		ref: HTMLInputElement | null;
	}>;

class PasswordInputState {
	constructor(
		readonly root: PasswordRootState,
		readonly opts: PasswordInputStateProps
	) {
		watch(
			() => this.opts.value.current,
			() => {
				if (this.root.passwordState.value !== this.opts.value.current) {
					this.root.passwordState.value = this.opts.value.current;
					// Clear submitted state once the user starts typing again after a submit
					if (this.root.passwordState.submitted) {
						this.root.passwordState.submitted = false;
					}
				}
			}
		);

		$effect(() => {
			// The score only counts while a meter is mounted. When the meter goes away, clear the
			// message this field set, but leave a custom validity it didn't set alone.
			const mounted = this.root.passwordState.strengthMounted;
			if (!mounted && untrack(() => this.root.passwordState.validityMessage) === '') return;

			const message = mounted
				? passwordValidityMessage(
						this.root.passwordState.value,
						this.root.opts.minScore.current,
						this.root.strength?.score ?? null
					)
				: '';
			this.opts.ref.current?.setCustomValidity(message);
			this.root.passwordState.validityMessage = message;
		});

		// Track the input element on the root so other primitives (e.g. Error) can read validity
		$effect(() => {
			this.root.passwordState.inputRef = this.opts.ref.current;
			return () => {
				if (this.root.passwordState.inputRef === this.opts.ref.current) {
					this.root.passwordState.inputRef = null;
				}
			};
		});

		// Listen to form submission to toggle submitted state reactively
		$effect(() => {
			const form = this.root.passwordState.inputRef?.form as HTMLFormElement | null;
			if (!form) return;
			const capture = true;
			const onSubmit = () => {
				this.root.passwordState.submitted = true;
			};
			form.addEventListener('submit', onSubmit, capture);
			const onInvalid = (e: Event) => {
				e.preventDefault();
				this.root.passwordState.submitted = true;
			};
			form.addEventListener('invalid', onInvalid, capture);

			return () => {
				form.removeEventListener('submit', onSubmit, capture);
				form.removeEventListener('invalid', onInvalid, capture);
			};
		});
	}

	props = $derived.by(() => {
		const input = this.root.passwordState.inputRef;
		void this.root.passwordState.validityMessage; // see `PasswordState.validityMessage`
		let invalid = false;
		if (input) {
			const submitted = this.root.passwordState.submitted;
			invalid = submitted && !input.validity.valid;
		}
		return {
			'aria-invalid': invalid ? true : undefined
		};
	});
}

class PasswordToggleVisibilityState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.toggleMounted = true;

		// this way we go back to the correct padding when toggle is unmounted
		$effect(() => {
			return () => {
				this.root.passwordState.toggleMounted = false;
			};
		});
	}
}

class PasswordCopyState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.copyMounted = true;

		// this way we go back to the correct padding when copy is unmounted
		$effect(() => {
			return () => {
				this.root.passwordState.copyMounted = false;
			};
		});
	}
}

class PasswordStrengthState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.strengthMounted = true;

		$effect(() => {
			return () => {
				this.root.passwordState.strengthMounted = false;
			};
		});
	}

	get strength() {
		return this.root.strength;
	}

	/** 0 until the checker has loaded */
	get score() {
		return this.root.score;
	}

	/** What the meter announces; undefined while the password is empty or the checker loads */
	get text() {
		return passwordStrengthText(this.root.passwordState.value, this.root.strength?.score ?? null);
	}
}

class PasswordErrorState {
	constructor(readonly root: PasswordRootState) {}

	// Message derived from the input's current validity. Does not trigger native UI.
	message = $derived.by(() => {
		const input = this.root.passwordState.inputRef;
		const customMessage = this.root.passwordState.validityMessage;
		if (!input) return null as string | null;

		// Only show errors after the form has been submitted
		const submitted = this.root.passwordState.submitted;
		if (!submitted) return null as string | null;

		// If invalid, craft a stable message without relying solely on validationMessage
		if (!input.validity.valid) {
			const v = input.validity;
			if (v.valueMissing) {
				const placeholder = input.getAttribute('placeholder')?.trim();
				if (placeholder) {
					return placeholder.endsWith('.') ? placeholder : `${placeholder}.`;
				}
				return 'Enter a password.';
			}
			// For other cases (pattern, tooShort, etc.) keep native/custom message fallback
			return customMessage || input.validationMessage || 'Invalid value';
		}

		return null as string | null;
	});

	get inputEl() {
		return this.root.passwordState.inputRef;
	}
}

const ctx = new Context<PasswordRootState>('password-root-state');

export function usePassword(props: PasswordRootStateProps) {
	return ctx.set(new PasswordRootState(props));
}

export function usePasswordInput(props: PasswordInputStateProps) {
	return new PasswordInputState(ctx.get(), props);
}

export function usePasswordToggleVisibility() {
	return new PasswordToggleVisibilityState(ctx.get());
}

export function usePasswordCopy() {
	return new PasswordCopyState(ctx.get());
}

export function usePasswordStrength() {
	return new PasswordStrengthState(ctx.get());
}

export function usePasswordError() {
	return new PasswordErrorState(ctx.get());
}
