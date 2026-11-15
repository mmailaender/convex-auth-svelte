# Upstreaming into @convex-dev/auth

This package mirrors the facade of `@convex-dev/auth` v2's React and Next.js clients, so the Svelte bindings could move into `@convex-dev/auth` with the same names. This page maps each module to its upstream counterpart, and lists what is copied from upstream today and what upstream would need to export so that nothing is.

## Module map

| Here                                | Upstream counterpart                                                        | Possible upstream path                            |
| ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| `src/lib/internal/core.svelte.ts`   | `src/react/client.tsx` (`AuthProvider`, `SessionWatcher`)                   | `src/svelte/client.svelte.ts`                     |
| `src/lib/svelte/index.svelte.ts`    | `src/react/index.tsx` (`ConvexAuthProvider`)                                | `@convex-dev/auth/svelte`                         |
| `src/lib/sveltekit/index.ts`        | `src/ssr/nextjs/client.tsx` (`ConvexAuthNextjsProvider`)                    | `@convex-dev/auth/ssr/sveltekit/client`           |
| `src/lib/sveltekit/server/index.ts` | `src/ssr/nextjs/index.tsx` (`setupConvexAuthNextjs`)                        | `@convex-dev/auth/ssr/sveltekit`                  |
| `src/lib/methods/<method>.ts`       | `src/methods/<method>/react.ts(x)`                                          | `@convex-dev/auth/methods/<method>/svelte`        |
| `src/lib/internal/oauthClient.ts`   | `src/methods/oauth/client.ts`                                               | none: use upstream's                              |
| `src/lib/internal/passkey/`         | `src/methods/username-passkey/` (`client.ts`, `flows.ts`, `react_impl.tsx`) | none: use upstream's, except `autofill.svelte.ts` |

The core already is a shared layer: `AuthClient` (`@convex-dev/auth/browser`) and the SSR handlers, `ServerAuthSession` and `createServerAuthChecker` (`@convex-dev/auth/ssr`) are used unchanged. The Svelte code only binds them to runes, context and `convex-svelte`.

## Copied from upstream

- `internal/oauthClient.ts` and `internal/retry.ts`. `oauth()` is only exported from `@convex-dev/auth/methods/oauth/react`, which imports React.
- `internal/storage.ts` re-implements the key namespacing of `NamespacedStorage`, because `AuthClient.storage` is `@internal` and stripped from the types. The email + password hooks keep their link secrets there, under upstream's keys.
- `internal/passkey/`: the passkey ceremonies, the sign-in and management flows, and the wire types, from `methods/username-passkey/client.ts`, `ceremonies.ts`, `flows.ts`, `base64url.ts` and `management/flows.ts`. Upstream exports them only from `@convex-dev/auth/methods/username-passkey/react`, or not at all. The modal ceremonies call `navigator.credentials` directly instead of `@simplewebauthn/browser`, so the package has no new dependency. The wire and result types are derived from the return type of `setupUsernamePasskey`. `autofill.svelte.ts` rewrites `react_impl.tsx` (the autofill loop and the ceremony slot) with runes.
- The flow logic of the method hooks (run the sign-in function, adopt the session, fold thrown errors into `OTHER_ERROR`, the email link state machines) is duplicated from the React hooks, around Svelte state instead of `useState`.

## What upstream could export

1. `oauth()` and its types from a framework-agnostic entry, e.g. `@convex-dev/auth/methods/oauth`.
2. The `AmbientSignInClient`, `AmbientSignInContext` and `AuthSignInApi` types from `@convex-dev/auth/browser`. They're derived from `AuthClientConfig` here.
3. Storage for method secrets: a public `AuthClient.storage`, or the `NamespacedStorage` class.
4. Framework-agnostic method clients, e.g. `createUsernamePasswordFlows({ authClient, signInApi })` returning plain async functions and a subscribable `pending`. The React hooks and the Svelte helpers would then be thin wrappers. This is the meaningful shared layer for email + password and passkeys.
5. The passkey ceremonies, flows and wire types (`methods/username-passkey/client.ts`, `ceremonies.ts`, `flows.ts`, `management/flows.ts`, and the passkey component's `validation.ts` types) from a non-React entry, e.g. `@convex-dev/auth/methods/username-passkey/client`. `internal/passkey` would then shrink to the runes rewrite of the autofill loop, from about 1,100 lines to about 350.

## Build

Svelte runes only compile in `.svelte` and `.svelte.ts` files, so upstream's `tsc` build would need `svelte-package` (or shipping the `.svelte.ts` sources under a `svelte` export condition) for the Svelte entry points.
