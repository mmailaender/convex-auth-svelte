import { Infer } from "convex/values";
import { ActionCtx, MutationCtx, SessionInfo } from "../types.js";
import * as Provider from "../provider.js";
export declare const verifyCodeAndSignInArgs: import("convex/values").VObject<{
    provider?: string | undefined;
    verifier?: string | undefined;
    generateTokens: boolean;
    params: any;
    allowExtraProviders: boolean;
}, {
    params: import("convex/values").VAny<any, "required", string>;
    provider: import("convex/values").VString<string | undefined, "optional">;
    verifier: import("convex/values").VString<string | undefined, "optional">;
    generateTokens: import("convex/values").VBoolean<boolean, "required">;
    allowExtraProviders: import("convex/values").VBoolean<boolean, "required">;
}, "required", "provider" | "verifier" | "generateTokens" | "params" | "allowExtraProviders" | `params.${string}`>;
type ReturnType = null | SessionInfo;
export declare function verifyCodeAndSignInImpl(ctx: MutationCtx, args: Infer<typeof verifyCodeAndSignInArgs>, getProviderOrThrow: Provider.GetProviderOrThrowFunc, config: Provider.Config): Promise<ReturnType>;
export declare const callVerifyCodeAndSignIn: (ctx: ActionCtx, args: Infer<typeof verifyCodeAndSignInArgs>) => Promise<ReturnType>;
export {};
