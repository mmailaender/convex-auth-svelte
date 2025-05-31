import { Infer } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
import { GetProviderOrThrowFunc } from "../provider.js";
export declare const modifyAccountArgs: import("convex/values").VObject<{
    account: {
        id: string;
        secret: string;
    };
    provider: string;
}, {
    provider: import("convex/values").VString<string, "required">;
    account: import("convex/values").VObject<{
        id: string;
        secret: string;
    }, {
        id: import("convex/values").VString<string, "required">;
        secret: import("convex/values").VString<string, "required">;
    }, "required", "id" | "secret">;
}, "required", "account" | "provider" | "account.id" | "account.secret">;
export declare function modifyAccountImpl(ctx: MutationCtx, args: Infer<typeof modifyAccountArgs>, getProviderOrThrow: GetProviderOrThrowFunc): Promise<void>;
export declare const callModifyAccount: (ctx: ActionCtx, args: Infer<typeof modifyAccountArgs>) => Promise<void>;
