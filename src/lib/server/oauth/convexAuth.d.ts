import { CookieOption, CookiesOptions } from "@auth/core/types.js";
import { InternalProvider } from "./types.js";
import { OAuthConfig } from "@auth/core/providers/oauth.js";
export declare function callbackUrl(providerId: string): string;
export declare function getAuthorizationSignature({ codeVerifier, state, nonce, }: {
    codeVerifier?: string;
    state?: string;
    nonce?: string;
}): string;
export declare const defaultCookiesOptions: (providerId: string) => Record<keyof CookiesOptions, CookieOption>;
export declare function oAuthConfigToInternalProvider(config: OAuthConfig<any>): Promise<InternalProvider<"oauth" | "oidc">>;
