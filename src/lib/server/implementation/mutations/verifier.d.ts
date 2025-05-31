import { GenericId } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
type ReturnType = GenericId<"authVerifiers">;
export declare function verifierImpl(ctx: MutationCtx): Promise<ReturnType>;
export declare const callVerifier: (ctx: ActionCtx) => Promise<ReturnType>;
export {};
