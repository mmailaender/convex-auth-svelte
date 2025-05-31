import { Infer } from "convex/values";
import { ActionCtx, Doc, MutationCtx } from "../types.js";
import * as Provider from "../provider.js";
export declare const retrieveAccountWithCredentialsArgs: import("convex/values").VObject<{
    account: {
        secret?: string | undefined;
        id: string;
    };
    provider: string;
}, {
    provider: import("convex/values").VString<string, "required">;
    account: import("convex/values").VObject<{
        secret?: string | undefined;
        id: string;
    }, {
        id: import("convex/values").VString<string, "required">;
        secret: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "id" | "secret">;
}, "required", "account" | "provider" | "account.id" | "account.secret">;
type ReturnType = "InvalidAccountId" | "TooManyFailedAttempts" | "InvalidSecret" | {
    account: Doc<"authAccounts">;
    user: Doc<"users">;
};
export declare function retrieveAccountWithCredentialsImpl(ctx: MutationCtx, args: Infer<typeof retrieveAccountWithCredentialsArgs>, getProviderOrThrow: Provider.GetProviderOrThrowFunc, config: Provider.Config): Promise<ReturnType>;
export declare const callRetreiveAccountWithCredentials: (ctx: ActionCtx, args: Infer<typeof retrieveAccountWithCredentialsArgs>) => Promise<ReturnType>;
export {};
