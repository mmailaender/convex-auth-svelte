import { InternalProvider } from "../../types.js";
export declare function isOIDCProvider(provider: InternalProvider<"oidc" | "oauth">): provider is InternalProvider<"oidc">;
