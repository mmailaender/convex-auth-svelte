import { DataModelFromSchemaDefinition, GenericActionCtx, GenericMutationCtx, GenericQueryCtx, TableNamesInDataModel } from "convex/server";
import { GenericId } from "convex/values";
import { GenericDoc } from "../convex_types.js";
/**
 * The table definitions required by the library.
 *
 * Your schema must include these so that the indexes
 * are set up:
 *
 *
 * ```ts filename="convex/schema.ts"
 * import { defineSchema } from "convex/server";
 * import { authTables } from "@convex-dev/auth/server";
 *
 * const schema = defineSchema({
 *   ...authTables,
 * });
 *
 * export default schema;
 * ```
 *
 * You can inline the table definitions into your schema
 * and extend them with additional optional and required
 * fields. See https://labs.convex.dev/auth/setup/schema
 * for more details.
 */
export declare const authTables: {
    /**
     * Users.
     */
    users: import("convex/server").TableDefinition<import("convex/values").VObject<{
        isAnonymous?: boolean | undefined;
        name?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        image?: string | undefined;
        emailVerificationTime?: number | undefined;
        phoneVerificationTime?: number | undefined;
    }, {
        name: import("convex/values").VString<string | undefined, "optional">;
        image: import("convex/values").VString<string | undefined, "optional">;
        email: import("convex/values").VString<string | undefined, "optional">;
        emailVerificationTime: import("convex/values").VFloat64<number | undefined, "optional">;
        phone: import("convex/values").VString<string | undefined, "optional">;
        phoneVerificationTime: import("convex/values").VFloat64<number | undefined, "optional">;
        isAnonymous: import("convex/values").VBoolean<boolean | undefined, "optional">;
    }, "required", "isAnonymous" | "name" | "email" | "phone" | "image" | "emailVerificationTime" | "phoneVerificationTime">, {
        email: ["email", "_creationTime"];
        phone: ["phone", "_creationTime"];
    }, {}, {}>;
    /**
     * Sessions.
     * A single user can have multiple active sessions.
     * See [Session document lifecycle](https://labs.convex.dev/auth/advanced#session-document-lifecycle).
     */
    authSessions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: GenericId<"users">;
        expirationTime: number;
    }, {
        userId: import("convex/values").VId<GenericId<"users">, "required">;
        expirationTime: import("convex/values").VFloat64<number, "required">;
    }, "required", "userId" | "expirationTime">, {
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    /**
     * Accounts. An account corresponds to
     * a single authentication provider.
     * A single user can have multiple accounts linked.
     */
    authAccounts: import("convex/server").TableDefinition<import("convex/values").VObject<{
        secret?: string | undefined;
        emailVerified?: string | undefined;
        phoneVerified?: string | undefined;
        providerAccountId: string;
        userId: GenericId<"users">;
        provider: string;
    }, {
        userId: import("convex/values").VId<GenericId<"users">, "required">;
        provider: import("convex/values").VString<string, "required">;
        providerAccountId: import("convex/values").VString<string, "required">;
        secret: import("convex/values").VString<string | undefined, "optional">;
        emailVerified: import("convex/values").VString<string | undefined, "optional">;
        phoneVerified: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "secret" | "providerAccountId" | "userId" | "provider" | "emailVerified" | "phoneVerified">, {
        userIdAndProvider: ["userId", "provider", "_creationTime"];
        providerAndAccountId: ["provider", "providerAccountId", "_creationTime"];
    }, {}, {}>;
    /**
     * Refresh tokens.
     * Refresh tokens are generally meant to be used once, to be exchanged for another
     * refresh token and a JWT access token, but with a few exceptions:
     * - The "active refresh token" is the most recently created refresh token that has
     *   not been used yet. The parent of the active refresh token can always be used to
     *   obtain the active refresh token.
     * - A refresh token can be used within a 10 second window ("reuse window") to
     *   obtain a new refresh token.
     * - On any invalid use of a refresh token, the token itself and all its descendants
     *   are invalidated.
     */
    authRefreshTokens: import("convex/server").TableDefinition<import("convex/values").VObject<{
        firstUsedTime?: number | undefined;
        parentRefreshTokenId?: GenericId<"authRefreshTokens"> | undefined;
        sessionId: GenericId<"authSessions">;
        expirationTime: number;
    }, {
        sessionId: import("convex/values").VId<GenericId<"authSessions">, "required">;
        expirationTime: import("convex/values").VFloat64<number, "required">;
        firstUsedTime: import("convex/values").VFloat64<number | undefined, "optional">;
        parentRefreshTokenId: import("convex/values").VId<GenericId<"authRefreshTokens"> | undefined, "optional">;
    }, "required", "sessionId" | "expirationTime" | "firstUsedTime" | "parentRefreshTokenId">, {
        sessionId: ["sessionId", "_creationTime"];
        sessionIdAndParentRefreshTokenId: ["sessionId", "parentRefreshTokenId", "_creationTime"];
    }, {}, {}>;
    /**
     * Verification codes:
     * - OTP tokens
     * - magic link tokens
     * - OAuth codes
     */
    authVerificationCodes: import("convex/server").TableDefinition<import("convex/values").VObject<{
        emailVerified?: string | undefined;
        phoneVerified?: string | undefined;
        verifier?: string | undefined;
        expirationTime: number;
        provider: string;
        accountId: GenericId<"authAccounts">;
        code: string;
    }, {
        accountId: import("convex/values").VId<GenericId<"authAccounts">, "required">;
        provider: import("convex/values").VString<string, "required">;
        code: import("convex/values").VString<string, "required">;
        expirationTime: import("convex/values").VFloat64<number, "required">;
        verifier: import("convex/values").VString<string | undefined, "optional">;
        emailVerified: import("convex/values").VString<string | undefined, "optional">;
        phoneVerified: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "expirationTime" | "provider" | "emailVerified" | "phoneVerified" | "accountId" | "code" | "verifier">, {
        accountId: ["accountId", "_creationTime"];
        code: ["code", "_creationTime"];
    }, {}, {}>;
    /**
     * PKCE verifiers for OAuth.
     */
    authVerifiers: import("convex/server").TableDefinition<import("convex/values").VObject<{
        sessionId?: GenericId<"authSessions"> | undefined;
        signature?: string | undefined;
    }, {
        sessionId: import("convex/values").VId<GenericId<"authSessions"> | undefined, "optional">;
        signature: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "sessionId" | "signature">, {
        signature: ["signature", "_creationTime"];
    }, {}, {}>;
    /**
     * Rate limits for OTP and password sign-in.
     */
    authRateLimits: import("convex/server").TableDefinition<import("convex/values").VObject<{
        identifier: string;
        lastAttemptTime: number;
        attemptsLeft: number;
    }, {
        identifier: import("convex/values").VString<string, "required">;
        lastAttemptTime: import("convex/values").VFloat64<number, "required">;
        attemptsLeft: import("convex/values").VFloat64<number, "required">;
    }, "required", "identifier" | "lastAttemptTime" | "attemptsLeft">, {
        identifier: ["identifier", "_creationTime"];
    }, {}, {}>;
};
declare const defaultSchema: import("convex/server").SchemaDefinition<{
    /**
     * Users.
     */
    users: import("convex/server").TableDefinition<import("convex/values").VObject<{
        isAnonymous?: boolean | undefined;
        name?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        image?: string | undefined;
        emailVerificationTime?: number | undefined;
        phoneVerificationTime?: number | undefined;
    }, {
        name: import("convex/values").VString<string | undefined, "optional">;
        image: import("convex/values").VString<string | undefined, "optional">;
        email: import("convex/values").VString<string | undefined, "optional">;
        emailVerificationTime: import("convex/values").VFloat64<number | undefined, "optional">;
        phone: import("convex/values").VString<string | undefined, "optional">;
        phoneVerificationTime: import("convex/values").VFloat64<number | undefined, "optional">;
        isAnonymous: import("convex/values").VBoolean<boolean | undefined, "optional">;
    }, "required", "isAnonymous" | "name" | "email" | "phone" | "image" | "emailVerificationTime" | "phoneVerificationTime">, {
        email: ["email", "_creationTime"];
        phone: ["phone", "_creationTime"];
    }, {}, {}>;
    /**
     * Sessions.
     * A single user can have multiple active sessions.
     * See [Session document lifecycle](https://labs.convex.dev/auth/advanced#session-document-lifecycle).
     */
    authSessions: import("convex/server").TableDefinition<import("convex/values").VObject<{
        userId: GenericId<"users">;
        expirationTime: number;
    }, {
        userId: import("convex/values").VId<GenericId<"users">, "required">;
        expirationTime: import("convex/values").VFloat64<number, "required">;
    }, "required", "userId" | "expirationTime">, {
        userId: ["userId", "_creationTime"];
    }, {}, {}>;
    /**
     * Accounts. An account corresponds to
     * a single authentication provider.
     * A single user can have multiple accounts linked.
     */
    authAccounts: import("convex/server").TableDefinition<import("convex/values").VObject<{
        secret?: string | undefined;
        emailVerified?: string | undefined;
        phoneVerified?: string | undefined;
        providerAccountId: string;
        userId: GenericId<"users">;
        provider: string;
    }, {
        userId: import("convex/values").VId<GenericId<"users">, "required">;
        provider: import("convex/values").VString<string, "required">;
        providerAccountId: import("convex/values").VString<string, "required">;
        secret: import("convex/values").VString<string | undefined, "optional">;
        emailVerified: import("convex/values").VString<string | undefined, "optional">;
        phoneVerified: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "secret" | "providerAccountId" | "userId" | "provider" | "emailVerified" | "phoneVerified">, {
        userIdAndProvider: ["userId", "provider", "_creationTime"];
        providerAndAccountId: ["provider", "providerAccountId", "_creationTime"];
    }, {}, {}>;
    /**
     * Refresh tokens.
     * Refresh tokens are generally meant to be used once, to be exchanged for another
     * refresh token and a JWT access token, but with a few exceptions:
     * - The "active refresh token" is the most recently created refresh token that has
     *   not been used yet. The parent of the active refresh token can always be used to
     *   obtain the active refresh token.
     * - A refresh token can be used within a 10 second window ("reuse window") to
     *   obtain a new refresh token.
     * - On any invalid use of a refresh token, the token itself and all its descendants
     *   are invalidated.
     */
    authRefreshTokens: import("convex/server").TableDefinition<import("convex/values").VObject<{
        firstUsedTime?: number | undefined;
        parentRefreshTokenId?: GenericId<"authRefreshTokens"> | undefined;
        sessionId: GenericId<"authSessions">;
        expirationTime: number;
    }, {
        sessionId: import("convex/values").VId<GenericId<"authSessions">, "required">;
        expirationTime: import("convex/values").VFloat64<number, "required">;
        firstUsedTime: import("convex/values").VFloat64<number | undefined, "optional">;
        parentRefreshTokenId: import("convex/values").VId<GenericId<"authRefreshTokens"> | undefined, "optional">;
    }, "required", "sessionId" | "expirationTime" | "firstUsedTime" | "parentRefreshTokenId">, {
        sessionId: ["sessionId", "_creationTime"];
        sessionIdAndParentRefreshTokenId: ["sessionId", "parentRefreshTokenId", "_creationTime"];
    }, {}, {}>;
    /**
     * Verification codes:
     * - OTP tokens
     * - magic link tokens
     * - OAuth codes
     */
    authVerificationCodes: import("convex/server").TableDefinition<import("convex/values").VObject<{
        emailVerified?: string | undefined;
        phoneVerified?: string | undefined;
        verifier?: string | undefined;
        expirationTime: number;
        provider: string;
        accountId: GenericId<"authAccounts">;
        code: string;
    }, {
        accountId: import("convex/values").VId<GenericId<"authAccounts">, "required">;
        provider: import("convex/values").VString<string, "required">;
        code: import("convex/values").VString<string, "required">;
        expirationTime: import("convex/values").VFloat64<number, "required">;
        verifier: import("convex/values").VString<string | undefined, "optional">;
        emailVerified: import("convex/values").VString<string | undefined, "optional">;
        phoneVerified: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "expirationTime" | "provider" | "emailVerified" | "phoneVerified" | "accountId" | "code" | "verifier">, {
        accountId: ["accountId", "_creationTime"];
        code: ["code", "_creationTime"];
    }, {}, {}>;
    /**
     * PKCE verifiers for OAuth.
     */
    authVerifiers: import("convex/server").TableDefinition<import("convex/values").VObject<{
        sessionId?: GenericId<"authSessions"> | undefined;
        signature?: string | undefined;
    }, {
        sessionId: import("convex/values").VId<GenericId<"authSessions"> | undefined, "optional">;
        signature: import("convex/values").VString<string | undefined, "optional">;
    }, "required", "sessionId" | "signature">, {
        signature: ["signature", "_creationTime"];
    }, {}, {}>;
    /**
     * Rate limits for OTP and password sign-in.
     */
    authRateLimits: import("convex/server").TableDefinition<import("convex/values").VObject<{
        identifier: string;
        lastAttemptTime: number;
        attemptsLeft: number;
    }, {
        identifier: import("convex/values").VString<string, "required">;
        lastAttemptTime: import("convex/values").VFloat64<number, "required">;
        attemptsLeft: import("convex/values").VFloat64<number, "required">;
    }, "required", "identifier" | "lastAttemptTime" | "attemptsLeft">, {
        identifier: ["identifier", "_creationTime"];
    }, {}, {}>;
}, true>;
export type AuthDataModel = DataModelFromSchemaDefinition<typeof defaultSchema>;
export type ActionCtx = GenericActionCtx<AuthDataModel>;
export type MutationCtx = GenericMutationCtx<AuthDataModel>;
export type QueryCtx = GenericQueryCtx<AuthDataModel>;
export type Doc<T extends TableNamesInDataModel<AuthDataModel>> = GenericDoc<AuthDataModel, T>;
export type Tokens = {
    token: string;
    refreshToken: string;
};
export type SessionInfo = {
    userId: GenericId<"users">;
    sessionId: GenericId<"authSessions">;
    tokens: Tokens | null;
};
export type SessionInfoWithTokens = {
    userId: GenericId<"users">;
    sessionId: GenericId<"authSessions">;
    tokens: Tokens;
};
export {};
