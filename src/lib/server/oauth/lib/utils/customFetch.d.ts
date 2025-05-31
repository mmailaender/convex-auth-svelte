import * as o from "oauth4webapi";
import type { InternalProvider } from "../../types";
import { OAuthConfig } from "@auth/core/providers/index.js";
export { customFetch } from "@auth/core";
type FetchOptResult = {
    [o.customFetch]: typeof fetch;
};
export declare function fetchOpt(providerOrConfig: InternalProvider<"oauth" | "oidc"> | OAuthConfig<any>): FetchOptResult;
