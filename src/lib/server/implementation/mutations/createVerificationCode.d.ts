import { GenericId, Infer } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
import * as Provider from "../provider.js";
export declare const createVerificationCodeArgs: import("convex/values").VObject<{
    email?: string | undefined;
    phone?: string | undefined;
    accountId?: GenericId<"authAccounts"> | undefined;
    expirationTime: number;
    provider: string;
    code: string;
    allowExtraProviders: boolean;
}, {
    accountId: import("convex/values").VId<GenericId<"authAccounts"> | undefined, "optional">;
    provider: import("convex/values").VString<string, "required">;
    email: import("convex/values").VString<string | undefined, "optional">;
    phone: import("convex/values").VString<string | undefined, "optional">;
    code: import("convex/values").VString<string, "required">;
    expirationTime: import("convex/values").VFloat64<number, "required">;
    allowExtraProviders: import("convex/values").VBoolean<boolean, "required">;
}, "required", "email" | "phone" | "expirationTime" | "provider" | "accountId" | "code" | "allowExtraProviders">;
type ReturnType = string;
export declare function createVerificationCodeImpl(ctx: MutationCtx, args: Infer<typeof createVerificationCodeArgs>, getProviderOrThrow: Provider.GetProviderOrThrowFunc, config: Provider.Config): Promise<ReturnType>;
export declare const callCreateVerificationCode: (ctx: ActionCtx, args: Infer<typeof createVerificationCodeArgs>) => Promise<ReturnType>;
export {};
