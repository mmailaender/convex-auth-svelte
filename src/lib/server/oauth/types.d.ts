import * as AuthCoreJwt from "@auth/core/jwt";
import { CookieOption, CookiesOptions } from "@auth/core/types.js";
import { OAuthConfigInternal, OIDCConfigInternal } from "./providers/oauth.js";
import { ProviderType } from "@auth/core/providers/index.js";
import * as o from "oauth4webapi";
export type ConvexAuthProviderType = "oauth" | "oidc";
export type ConfigSource = "discovered" | "provided";
export type InternalProvider<T = ProviderType> = (T extends "oauth" ? OAuthConfigInternal<any> : T extends "oidc" ? OIDCConfigInternal<any> : never) & {
    as: o.AuthorizationServer;
    configSource: ConfigSource;
};
export type JWTOptions = AuthCoreJwt.JWTOptions & {
    secret: string | string[];
};
/** @internal */
export interface InternalOptions<TProviderType extends ConvexAuthProviderType> {
    provider: InternalProvider<TProviderType>;
    /**
     * `true` if the [Double-submit CSRF check](https://owasp.org/www-chapter-london/assets/slides/David_Johansson-Double_Defeat_of_Double-Submit_Cookie.pdf) was succesful
     * or [`skipCSRFCheck`](https://authjs.dev/reference/core#skipcsrfcheck) was enabled.
     */
    cookies: Record<keyof CookiesOptions, CookieOption>;
}
