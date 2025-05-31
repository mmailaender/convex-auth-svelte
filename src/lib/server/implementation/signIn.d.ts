import { GenericId } from "convex/values";
import { AuthProviderMaterializedConfig, GenericActionCtxWithAuthConfig } from "../types.js";
import { AuthDataModel, SessionInfo, Tokens } from "./types.js";
type EnrichedActionCtx = GenericActionCtxWithAuthConfig<AuthDataModel>;
export declare function signInImpl(ctx: EnrichedActionCtx, provider: AuthProviderMaterializedConfig | null, args: {
    accountId?: GenericId<"authAccounts">;
    params?: Record<string, any>;
    verifier?: string;
    refreshToken?: string;
    calledBy?: string;
}, options: {
    generateTokens: boolean;
    allowExtraProviders: boolean;
}): Promise<{
    kind: "signedIn";
    signedIn: SessionInfo | null;
} | {
    kind: "refreshTokens";
    signedIn: {
        tokens: Tokens;
    };
} | {
    kind: "started";
    started: true;
} | {
    kind: "redirect";
    redirect: string;
    verifier: string;
}>;
export {};
