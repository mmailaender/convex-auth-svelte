import { Infer } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
import * as Provider from "../provider.js";
export declare const refreshSessionArgs: import("convex/values").VObject<{
    refreshToken: string;
}, {
    refreshToken: import("convex/values").VString<string, "required">;
}, "required", "refreshToken">;
type ReturnType = null | {
    token: string;
    refreshToken: string;
};
export declare function refreshSessionImpl(ctx: MutationCtx, args: Infer<typeof refreshSessionArgs>, getProviderOrThrow: Provider.GetProviderOrThrowFunc, config: Provider.Config): Promise<ReturnType>;
export declare const callRefreshSession: (ctx: ActionCtx, args: Infer<typeof refreshSessionArgs>) => Promise<ReturnType>;
export {};
