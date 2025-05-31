import type { InternalOptions } from "./types.js";
import { Cookie } from "@auth/core/lib/utils/cookie.js";
/**
 * @see https://www.rfc-editor.org/rfc/rfc7636
 * @see https://danielfett.de/2020/05/16/pkce-vs-nonce-equivalent-or-not/#pkce
 */
export declare const pkce: {
    /** Creates a PKCE code challenge and verifier pair. The verifier is stored in the cookie. */
    create(options: InternalOptions<"oauth">): Promise<{
        cookie: Cookie;
        codeChallenge: string;
        codeVerifier: string;
    }>;
    /**
     * Returns code_verifier if the provider is configured to use PKCE,
     * and clears the container cookie afterwards.
     * An error is thrown if the code_verifier is missing or invalid.
     */
    use: (cookies: Record<string, string | undefined>, resCookies: Cookie[], options: InternalOptions<"oidc">) => Promise<string | undefined>;
};
/**
 * @see https://www.rfc-editor.org/rfc/rfc6749#section-10.12
 * @see https://www.rfc-editor.org/rfc/rfc6749#section-4.1.1
 */
export declare const state: {
    /** Creates a state cookie with an optionally encoded body. */
    create(options: InternalOptions<"oauth">, origin?: string): Promise<{
        cookie: Cookie;
        value: string;
    } | undefined>;
    /**
     * Returns state if the provider is configured to use state,
     * and clears the container cookie afterwards.
     * An error is thrown if the state is missing or invalid.
     */
    use: (cookies: Record<string, string | undefined>, resCookies: Cookie[], options: InternalOptions<"oidc">) => Promise<string | undefined>;
};
export declare const nonce: {
    create(options: InternalOptions<"oidc">): Promise<{
        cookie: Cookie;
        value: string;
    } | undefined>;
    /**
     * Returns nonce if the provider is configured to use nonce,
     * and clears the container cookie afterwards.
     * An error is thrown if the nonce is missing or invalid.
     * @see https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
     * @see https://danielfett.de/2020/05/16/pkce-vs-nonce-equivalent-or-not/#nonce
     */
    use: (cookies: Record<string, string | undefined>, resCookies: Cookie[], options: InternalOptions<"oidc">) => Promise<string | undefined>;
};
