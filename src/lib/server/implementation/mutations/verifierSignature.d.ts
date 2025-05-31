import { Infer } from "convex/values";
import { ActionCtx, MutationCtx } from "../types.js";
export declare const verifierSignatureArgs: import("convex/values").VObject<{
    verifier: string;
    signature: string;
}, {
    verifier: import("convex/values").VString<string, "required">;
    signature: import("convex/values").VString<string, "required">;
}, "required", "verifier" | "signature">;
type ReturnType = void;
export declare function verifierSignatureImpl(ctx: MutationCtx, args: Infer<typeof verifierSignatureArgs>): Promise<ReturnType>;
export declare const callVerifierSignature: (ctx: ActionCtx, args: Infer<typeof verifierSignatureArgs>) => Promise<void>;
export {};
