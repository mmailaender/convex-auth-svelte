import { GenericId } from "convex/values";
import { ConvexAuthConfig } from "../index.js";
export declare function generateToken(args: {
    userId: GenericId<"users">;
    sessionId: GenericId<"authSessions">;
}, config: ConvexAuthConfig): Promise<string>;
