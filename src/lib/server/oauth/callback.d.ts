import { InternalOptions } from "./types.js";
import { Cookie } from "@auth/core/lib/utils/cookie.js";
import { Account, Profile, TokenSet } from "@auth/core/types.js";
/**
 * Handles the following OAuth steps.
 * https://www.rfc-editor.org/rfc/rfc6749#section-4.1.1
 * https://www.rfc-editor.org/rfc/rfc6749#section-4.1.3
 * https://openid.net/specs/openid-connect-core-1_0.html#UserInfoRequest
 *
 * @note Although requesting userinfo is not required by the OAuth2.0 spec,
 * we fetch it anyway. This is because we always want a user profile.
 */
export declare function handleOAuth(params: Record<string, string>, cookies: Record<string, string | undefined>, options: InternalOptions<"oauth" | "oidc">): Promise<{
    profile: Profile;
    tokens: TokenSet & Pick<Account, "expires_at">;
    cookies: Cookie[];
    signature: string;
}>;
