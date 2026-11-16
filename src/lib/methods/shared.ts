import type { SlimTokenBundle, TokenBundle } from '../internal/types.js';

/**
 * A sign-in result as the client sees it: the token bundle narrowed to the
 * access-only part that both session models deliver (under SSR the auth proxy
 * strips the refresh token). Leaves error arms untouched.
 */
export type ClientView<T> = T extends { tokens: TokenBundle }
	? Omit<T, 'tokens'> & { tokens: SlimTokenBundle }
	: T;
