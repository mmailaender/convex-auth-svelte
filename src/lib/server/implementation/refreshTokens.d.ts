import { GenericId } from "convex/values";
import { ConvexAuthConfig } from "../index.js";
import { Doc, MutationCtx, QueryCtx } from "./types.js";
export declare const REFRESH_TOKEN_REUSE_WINDOW_MS: number;
export declare function createRefreshToken(ctx: MutationCtx, config: ConvexAuthConfig, sessionId: GenericId<"authSessions">, parentRefreshTokenId: GenericId<"authRefreshTokens"> | null): Promise<GenericId<"authRefreshTokens">>;
export declare const formatRefreshToken: (refreshTokenId: GenericId<"authRefreshTokens">, sessionId: GenericId<"authSessions">) => string;
export declare const parseRefreshToken: (refreshToken: string) => {
    refreshTokenId: GenericId<"authRefreshTokens">;
    sessionId: GenericId<"authSessions">;
};
/**
 * Mark all refresh tokens descending from the given refresh token as invalid immediately.
 * This is used when we detect an invalid use of a refresh token, and want to revoke
 * the entire tree.
 *
 * @param ctx
 * @param refreshToken
 */
export declare function invalidateRefreshTokensInSubtree(ctx: MutationCtx, refreshToken: Doc<"authRefreshTokens">): Promise<Doc<"authRefreshTokens">[]>;
export declare function deleteAllRefreshTokens(ctx: MutationCtx, sessionId: GenericId<"authSessions">): Promise<void>;
export declare function refreshTokenIfValid(ctx: MutationCtx, refreshTokenId: string, tokenSessionId: string): Promise<{
    session: {
        _id: GenericId<"authSessions">;
        _creationTime: number;
        userId: GenericId<"users">;
        expirationTime: number;
    };
    refreshTokenDoc: {
        _id: GenericId<"authRefreshTokens">;
        _creationTime: number;
        firstUsedTime?: number | undefined;
        parentRefreshTokenId?: GenericId<"authRefreshTokens"> | undefined;
        sessionId: GenericId<"authSessions">;
        expirationTime: number;
    };
} | null>;
/**
 * The active refresh token is the most recently created refresh token that has
 * never been used.
 *
 * @param ctx
 * @param sessionId
 */
export declare function loadActiveRefreshToken(ctx: QueryCtx, sessionId: GenericId<"authSessions">): Promise<{
    _id: GenericId<"authRefreshTokens">;
    _creationTime: number;
    firstUsedTime?: number | undefined;
    parentRefreshTokenId?: GenericId<"authRefreshTokens"> | undefined;
    sessionId: GenericId<"authSessions">;
    expirationTime: number;
} | null>;
