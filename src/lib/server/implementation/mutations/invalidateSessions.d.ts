import { Infer } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
export declare const invalidateSessionsArgs: import("convex/values").VObject<{
    except?: import("convex/values").GenericId<"authSessions">[] | undefined;
    userId: import("convex/values").GenericId<"users">;
}, {
    userId: import("convex/values").VId<import("convex/values").GenericId<"users">, "required">;
    except: import("convex/values").VArray<import("convex/values").GenericId<"authSessions">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"authSessions">, "required">, "optional">;
}, "required", "userId" | "except">;
export declare const callInvalidateSessions: (ctx: ActionCtx, args: Infer<typeof invalidateSessionsArgs>) => Promise<void>;
export declare const invalidateSessionsImpl: (ctx: MutationCtx, args: Infer<typeof invalidateSessionsArgs>) => Promise<void>;
