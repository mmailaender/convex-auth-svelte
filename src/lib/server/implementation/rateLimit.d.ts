import { ConvexAuthConfig } from "../index.js";
import { MutationCtx } from "./types.js";
export declare function isSignInRateLimited(ctx: MutationCtx, identifier: string, config: ConvexAuthConfig): Promise<boolean>;
export declare function recordFailedSignIn(ctx: MutationCtx, identifier: string, config: ConvexAuthConfig): Promise<void>;
export declare function resetSignInRateLimit(ctx: MutationCtx, identifier: string): Promise<void>;
