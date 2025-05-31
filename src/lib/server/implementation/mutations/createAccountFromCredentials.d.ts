import { Infer } from "convex/values";
import { ActionCtx, Doc, MutationCtx } from "../types.js";
import * as Provider from "../provider.js";
export declare const createAccountFromCredentialsArgs: import("convex/values").VObject<{
    shouldLinkViaEmail?: boolean | undefined;
    shouldLinkViaPhone?: boolean | undefined;
    profile: any;
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
    profile: import("convex/values").VAny<any, "required", string>;
    shouldLinkViaEmail: import("convex/values").VBoolean<boolean | undefined, "optional">;
    shouldLinkViaPhone: import("convex/values").VBoolean<boolean | undefined, "optional">;
}, "required", "profile" | "account" | "provider" | `profile.${string}` | "shouldLinkViaEmail" | "shouldLinkViaPhone" | "account.id" | "account.secret">;
type ReturnType = {
    account: Doc<"authAccounts">;
    user: Doc<"users">;
};
export declare function createAccountFromCredentialsImpl(ctx: MutationCtx, args: Infer<typeof createAccountFromCredentialsArgs>, getProviderOrThrow: Provider.GetProviderOrThrowFunc, config: Provider.Config): Promise<ReturnType>;
export declare const callCreateAccountFromCredentials: (ctx: ActionCtx, args: Infer<typeof createAccountFromCredentialsArgs>) => Promise<ReturnType>;
export {};
