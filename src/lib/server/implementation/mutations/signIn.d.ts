import { Infer } from "convex/values";
import { ActionCtx, MutationCtx, SessionInfo } from "../types.js";
import * as Provider from "../provider.js";
export declare const signInArgs: import("convex/values").VObject<{
    sessionId?: import("convex/values").GenericId<"authSessions"> | undefined;
    userId: import("convex/values").GenericId<"users">;
    generateTokens: boolean;
}, {
    userId: import("convex/values").VId<import("convex/values").GenericId<"users">, "required">;
    sessionId: import("convex/values").VId<import("convex/values").GenericId<"authSessions"> | undefined, "optional">;
    generateTokens: import("convex/values").VBoolean<boolean, "required">;
}, "required", "userId" | "sessionId" | "generateTokens">;
type ReturnType = SessionInfo;
export declare function signInImpl(ctx: MutationCtx, args: Infer<typeof signInArgs>, config: Provider.Config): Promise<ReturnType>;
export declare const callSignIn: (ctx: ActionCtx, args: Infer<typeof signInArgs>) => Promise<ReturnType>;
export {};
