import type { TokenStorage } from '@convex-dev/auth/browser';

/** Read/write/delete one namespaced value. */
export type NamespacedStorage = {
	get(key: string): ReturnType<TokenStorage['getItem']>;
	set(key: string, value: string): ReturnType<TokenStorage['setItem']>;
	remove(key: string): ReturnType<TokenStorage['removeItem']>;
};

/**
 * A view over a {@link TokenStorage} that suffixes every key with the
 * sanitized namespace, exactly like the `AuthClient` of `@convex-dev/auth`
 * does for its own keys. The sign-in methods keep their secrets here (e.g.
 * the browser secret of an email link flow), so they share a namespace, and
 * thus a session, with the tokens.
 */
export function namespacedStorage(storage: TokenStorage, namespace: string): NamespacedStorage {
	const suffix = namespace.replace(/[^a-zA-Z0-9]/g, '');
	const key = (name: string) => `${name}_${suffix}`;
	return {
		get: (name) => storage.getItem(key(name)),
		set: (name, value) => storage.setItem(key(name), value),
		remove: (name) => storage.removeItem(key(name))
	};
}
