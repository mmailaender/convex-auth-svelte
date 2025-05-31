import { Infer } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
import * as Provider from "../provider.js";
export declare const userOAuthArgs: import("convex/values").VObject<{
    profile: any;
    providerAccountId: string;
    provider: string;
    signature: string;
}, {
    provider: import("convex/values").VString<string, "required">;
    providerAccountId: import("convex/values").VString<string, "required">;
    profile: import("convex/values").VAny<any, "required", string>;
    signature: import("convex/values").VString<string, "required">;
}, "required", "profile" | "providerAccountId" | "provider" | "signature" | `profile.${string}`>;
type ReturnType = string;
export declare function userOAuthImpl(ctx: MutationCtx, args: Infer<typeof userOAuthArgs>, getProviderOrThrow: Provider.GetProviderOrThrowFunc, config: Provider.Config): Promise<ReturnType>;
export declare const callUserOAuth: (ctx: ActionCtx, args: Infer<typeof userOAuthArgs>) => Promise<ReturnType>;
export {};
