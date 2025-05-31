import { GenericId } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
type ReturnType = {
    userId: GenericId<"users">;
    sessionId: GenericId<"authSessions">;
} | null;
export declare function signOutImpl(ctx: MutationCtx): Promise<ReturnType>;
export declare const callSignOut: (ctx: ActionCtx) => Promise<void>;
export {};
