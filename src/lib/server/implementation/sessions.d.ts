import { GenericId } from "convex/values";
import { ConvexAuthConfig } from "../index.js";
import { Doc, MutationCtx, SessionInfo } from "./types.js";
import { Auth } from "convex/server";
export declare function maybeGenerateTokensForSession(ctx: MutationCtx, config: ConvexAuthConfig, userId: GenericId<"users">, sessionId: GenericId<"authSessions">, generateTokens: boolean): Promise<SessionInfo>;
export declare function createNewAndDeleteExistingSession(ctx: MutationCtx, config: ConvexAuthConfig, userId: GenericId<"users">): Promise<GenericId<"authSessions">>;
export declare function generateTokensForSession(ctx: MutationCtx, config: ConvexAuthConfig, args: {
    userId: GenericId<"users">;
    sessionId: GenericId<"authSessions">;
    issuedRefreshTokenId: GenericId<"authRefreshTokens"> | null;
    parentRefreshTokenId: GenericId<"authRefreshTokens"> | null;
}): Promise<{
    token: string;
    refreshToken: string;
}>;
export declare function deleteSession(ctx: MutationCtx, session: Doc<"authSessions">): Promise<void>;
/**
 * Return the current session ID.
 *
 * ```ts filename="convex/myFunctions.tsx"
 * import { mutation } from "./_generated/server";
 * import { getAuthSessionId } from "@convex-dev/auth/server";
 *
 * export const doSomething = mutation({
 *   args: {/* ... *\/},
 *   handler: async (ctx, args) => {
 *     const sessionId = await getAuthSessionId(ctx);
 *     if (sessionId === null) {
 *       throw new Error("Client is not authenticated!")
 *     }
 *     const session = await ctx.db.get(sessionId);
 *     // ...
 *   },
 * });
 * ```
 *
 * @param ctx query, mutation or action `ctx`
 * @returns the session ID or `null` if the client isn't authenticated
 */
export declare function getAuthSessionId(ctx: {
    auth: Auth;
}): Promise<GenericId<"authSessions"> | null>;
