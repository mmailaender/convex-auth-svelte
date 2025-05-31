import { GenericId } from "convex/values";
import { Doc, MutationCtx, QueryCtx } from "./types.js";
import { AuthProviderMaterializedConfig, ConvexAuthConfig } from "../types.js";
type CreateOrUpdateUserArgs = {
    type: "oauth" | "credentials" | "email" | "phone" | "verification";
    provider: AuthProviderMaterializedConfig;
    profile: Record<string, unknown> & {
        email?: string;
        phone?: string;
        emailVerified?: boolean;
        phoneVerified?: boolean;
    };
    shouldLinkViaEmail?: boolean;
    shouldLinkViaPhone?: boolean;
};
export declare function upsertUserAndAccount(ctx: MutationCtx, sessionId: GenericId<"authSessions"> | null, account: {
    existingAccount: Doc<"authAccounts">;
} | {
    providerAccountId: string;
    secret?: string;
}, args: CreateOrUpdateUserArgs, config: ConvexAuthConfig): Promise<{
    userId: GenericId<"users">;
    accountId: GenericId<"authAccounts">;
}>;
export declare function getAccountOrThrow(ctx: QueryCtx, existingAccountId: GenericId<"authAccounts">): Promise<{
    _id: GenericId<"authAccounts">;
    _creationTime: number;
    secret?: string | undefined;
    emailVerified?: string | undefined;
    phoneVerified?: string | undefined;
    providerAccountId: string;
    userId: GenericId<"users">;
    provider: string;
}>;
export {};
