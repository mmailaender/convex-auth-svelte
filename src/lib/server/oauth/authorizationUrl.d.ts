import { InternalOptions } from "./types.js";
import { Cookie } from "@auth/core/lib/utils/cookie.js";
/**
 * Generates an authorization/request token URL.
 *
 * [OAuth 2](https://www.oauth.com/oauth2-servers/authorization/the-authorization-request/)
 */
export declare function getAuthorizationUrl(options: InternalOptions<"oauth" | "oidc">): Promise<{
    redirect: string;
    cookies: Cookie[];
    signature: string;
}>;
