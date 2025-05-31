import { Infer } from "convex/values";
import { MutationCtx } from "../types.js";
import * as Provider from "../provider.js";
export { callInvalidateSessions } from "./invalidateSessions.js";
export { callModifyAccount } from "./modifyAccount.js";
export { callRetreiveAccountWithCredentials } from "./retrieveAccountWithCredentials.js";
export { callCreateAccountFromCredentials } from "./createAccountFromCredentials.js";
export { callCreateVerificationCode } from "./createVerificationCode.js";
export { callUserOAuth } from "./userOAuth.js";
export { callVerifierSignature } from "./verifierSignature.js";
export { callVerifyCodeAndSignIn } from "./verifyCodeAndSignIn.js";
export { callVerifier } from "./verifier.js";
export { callRefreshSession } from "./refreshSession.js";
export { callSignOut } from "./signOut.js";
export { callSignIn } from "./signIn.js";
export declare const storeArgs: import("convex/values").VObject<{
    args: {
        sessionId?: import("convex/values").GenericId<"authSessions"> | undefined;
        type: "signIn";
        userId: import("convex/values").GenericId<"users">;
        generateTokens: boolean;
    } | {
        type: "signOut";
    } | {
        type: "refreshSession";
        refreshToken: string;
    } | {
        provider?: string | undefined;
        verifier?: string | undefined;
        type: "verifyCodeAndSignIn";
        generateTokens: boolean;
        params: any;
        allowExtraProviders: boolean;
    } | {
        type: "verifier";
    } | {
        type: "verifierSignature";
        verifier: string;
        signature: string;
    } | {
        type: "userOAuth";
        profile: any;
        providerAccountId: string;
        provider: string;
        signature: string;
    } | {
        email?: string | undefined;
        phone?: string | undefined;
        accountId?: import("convex/values").GenericId<"authAccounts"> | undefined;
        type: "createVerificationCode";
        expirationTime: number;
        provider: string;
        code: string;
        allowExtraProviders: boolean;
    } | {
        shouldLinkViaEmail?: boolean | undefined;
        shouldLinkViaPhone?: boolean | undefined;
        type: "createAccountFromCredentials";
        profile: any;
        account: {
            secret?: string | undefined;
            id: string;
        };
        provider: string;
    } | {
        type: "retrieveAccountWithCredentials";
        account: {
            secret?: string | undefined;
            id: string;
        };
        provider: string;
    } | {
        type: "modifyAccount";
        account: {
            id: string;
            secret: string;
        };
        provider: string;
    } | {
        except?: import("convex/values").GenericId<"authSessions">[] | undefined;
        type: "invalidateSessions";
        userId: import("convex/values").GenericId<"users">;
    };
}, {
    args: import("convex/values").VUnion<{
        sessionId?: import("convex/values").GenericId<"authSessions"> | undefined;
        type: "signIn";
        userId: import("convex/values").GenericId<"users">;
        generateTokens: boolean;
    } | {
        type: "signOut";
    } | {
        type: "refreshSession";
        refreshToken: string;
    } | {
        provider?: string | undefined;
        verifier?: string | undefined;
        type: "verifyCodeAndSignIn";
        generateTokens: boolean;
        params: any;
        allowExtraProviders: boolean;
    } | {
        type: "verifier";
    } | {
        type: "verifierSignature";
        verifier: string;
        signature: string;
    } | {
        type: "userOAuth";
        profile: any;
        providerAccountId: string;
        provider: string;
        signature: string;
    } | {
        email?: string | undefined;
        phone?: string | undefined;
        accountId?: import("convex/values").GenericId<"authAccounts"> | undefined;
        type: "createVerificationCode";
        expirationTime: number;
        provider: string;
        code: string;
        allowExtraProviders: boolean;
    } | {
        shouldLinkViaEmail?: boolean | undefined;
        shouldLinkViaPhone?: boolean | undefined;
        type: "createAccountFromCredentials";
        profile: any;
        account: {
            secret?: string | undefined;
            id: string;
        };
        provider: string;
    } | {
        type: "retrieveAccountWithCredentials";
        account: {
            secret?: string | undefined;
            id: string;
        };
        provider: string;
    } | {
        type: "modifyAccount";
        account: {
            id: string;
            secret: string;
        };
        provider: string;
    } | {
        except?: import("convex/values").GenericId<"authSessions">[] | undefined;
        type: "invalidateSessions";
        userId: import("convex/values").GenericId<"users">;
    }, [import("convex/values").VObject<{
        sessionId?: import("convex/values").GenericId<"authSessions"> | undefined;
        type: "signIn";
        userId: import("convex/values").GenericId<"users">;
        generateTokens: boolean;
    }, {
        userId: import("convex/values").VId<import("convex/values").GenericId<"users">, "required">;
        sessionId: import("convex/values").VId<import("convex/values").GenericId<"authSessions"> | undefined, "optional">;
        generateTokens: import("convex/values").VBoolean<boolean, "required">;
        type: import("convex/values").VLiteral<"signIn", "required">;
    }, "required", "type" | "userId" | "sessionId" | "generateTokens">, import("convex/values").VObject<{
        type: "signOut";
    }, {
        type: import("convex/values").VLiteral<"signOut", "required">;
    }, "required", "type">, import("convex/values").VObject<{
        type: "refreshSession";
        refreshToken: string;
    }, {
        refreshToken: import("convex/values").VString<string, "required">;
        type: import("convex/values").VLiteral<"refreshSession", "required">;
    }, "required", "type" | "refreshToken">, import("convex/values").VObject<{
        provider?: string | undefined;
        verifier?: string | undefined;
        type: "verifyCodeAndSignIn";
        generateTokens: boolean;
        params: any;
        allowExtraProviders: boolean;
    }, {
        params: import("convex/values").VAny<any, "required", string>;
        provider: import("convex/values").VString<string | undefined, "optional">;
        verifier: import("convex/values").VString<string | undefined, "optional">;
        generateTokens: import("convex/values").VBoolean<boolean, "required">;
        allowExtraProviders: import("convex/values").VBoolean<boolean, "required">;
        type: import("convex/values").VLiteral<"verifyCodeAndSignIn", "required">;
    }, "required", "type" | "provider" | "verifier" | "generateTokens" | "params" | "allowExtraProviders" | `params.${string}`>, import("convex/values").VObject<{
        type: "verifier";
    }, {
        type: import("convex/values").VLiteral<"verifier", "required">;
    }, "required", "type">, import("convex/values").VObject<{
        type: "verifierSignature";
        verifier: string;
        signature: string;
    }, {
        verifier: import("convex/values").VString<string, "required">;
        signature: import("convex/values").VString<string, "required">;
        type: import("convex/values").VLiteral<"verifierSignature", "required">;
    }, "required", "type" | "verifier" | "signature">, import("convex/values").VObject<{
        type: "userOAuth";
        profile: any;
        providerAccountId: string;
        provider: string;
        signature: string;
    }, {
        provider: import("convex/values").VString<string, "required">;
        providerAccountId: import("convex/values").VString<string, "required">;
        profile: import("convex/values").VAny<any, "required", string>;
        signature: import("convex/values").VString<string, "required">;
        type: import("convex/values").VLiteral<"userOAuth", "required">;
    }, "required", "type" | "profile" | "providerAccountId" | "provider" | "signature" | `profile.${string}`>, import("convex/values").VObject<{
        email?: string | undefined;
        phone?: string | undefined;
        accountId?: import("convex/values").GenericId<"authAccounts"> | undefined;
        type: "createVerificationCode";
        expirationTime: number;
        provider: string;
        code: string;
        allowExtraProviders: boolean;
    }, {
        accountId: import("convex/values").VId<import("convex/values").GenericId<"authAccounts"> | undefined, "optional">;
        provider: import("convex/values").VString<string, "required">;
        email: import("convex/values").VString<string | undefined, "optional">;
        phone: import("convex/values").VString<string | undefined, "optional">;
        code: import("convex/values").VString<string, "required">;
        expirationTime: import("convex/values").VFloat64<number, "required">;
        allowExtraProviders: import("convex/values").VBoolean<boolean, "required">;
        type: import("convex/values").VLiteral<"createVerificationCode", "required">;
    }, "required", "type" | "email" | "phone" | "expirationTime" | "provider" | "accountId" | "code" | "allowExtraProviders">, import("convex/values").VObject<{
        shouldLinkViaEmail?: boolean | undefined;
        shouldLinkViaPhone?: boolean | undefined;
        type: "createAccountFromCredentials";
        profile: any;
        account: {
            secret?: string | undefined;
            id: string;
        };
        provider: string;
    }, {
        provider: import("convex/values").VString<string, "required">;
        account: import("convex/values").VObject<{
            secret?: string | undefined;
            id: string;
        }, {
            id: import("convex/values").VString<string, "required">;
            secret: import("convex/values").VString<string | undefined, "optional">;
        }, "required", "id" | "secret">;
        profile: import("convex/values").VAny<any, "required", string>;
        shouldLinkViaEmail: import("convex/values").VBoolean<boolean | undefined, "optional">;
        shouldLinkViaPhone: import("convex/values").VBoolean<boolean | undefined, "optional">;
        type: import("convex/values").VLiteral<"createAccountFromCredentials", "required">;
    }, "required", "type" | "profile" | "account" | "provider" | `profile.${string}` | "shouldLinkViaEmail" | "shouldLinkViaPhone" | "account.id" | "account.secret">, import("convex/values").VObject<{
        type: "retrieveAccountWithCredentials";
        account: {
            secret?: string | undefined;
            id: string;
        };
        provider: string;
    }, {
        provider: import("convex/values").VString<string, "required">;
        account: import("convex/values").VObject<{
            secret?: string | undefined;
            id: string;
        }, {
            id: import("convex/values").VString<string, "required">;
            secret: import("convex/values").VString<string | undefined, "optional">;
        }, "required", "id" | "secret">;
        type: import("convex/values").VLiteral<"retrieveAccountWithCredentials", "required">;
    }, "required", "type" | "account" | "provider" | "account.id" | "account.secret">, import("convex/values").VObject<{
        type: "modifyAccount";
        account: {
            id: string;
            secret: string;
        };
        provider: string;
    }, {
        provider: import("convex/values").VString<string, "required">;
        account: import("convex/values").VObject<{
            id: string;
            secret: string;
        }, {
            id: import("convex/values").VString<string, "required">;
            secret: import("convex/values").VString<string, "required">;
        }, "required", "id" | "secret">;
        type: import("convex/values").VLiteral<"modifyAccount", "required">;
    }, "required", "type" | "account" | "provider" | "account.id" | "account.secret">, import("convex/values").VObject<{
        except?: import("convex/values").GenericId<"authSessions">[] | undefined;
        type: "invalidateSessions";
        userId: import("convex/values").GenericId<"users">;
    }, {
        userId: import("convex/values").VId<import("convex/values").GenericId<"users">, "required">;
        except: import("convex/values").VArray<import("convex/values").GenericId<"authSessions">[] | undefined, import("convex/values").VId<import("convex/values").GenericId<"authSessions">, "required">, "optional">;
        type: import("convex/values").VLiteral<"invalidateSessions", "required">;
    }, "required", "type" | "userId" | "except">], "required", "type" | "profile" | "account" | "email" | "phone" | "providerAccountId" | "userId" | "sessionId" | "expirationTime" | "provider" | "accountId" | "code" | "verifier" | "signature" | "generateTokens" | "refreshToken" | "params" | "allowExtraProviders" | `params.${string}` | `profile.${string}` | "shouldLinkViaEmail" | "shouldLinkViaPhone" | "account.id" | "account.secret" | "except">;
}, "required", "args" | "args.type" | "args.profile" | "args.account" | "args.email" | "args.phone" | "args.providerAccountId" | "args.userId" | "args.sessionId" | "args.expirationTime" | "args.provider" | "args.accountId" | "args.code" | "args.verifier" | "args.signature" | "args.generateTokens" | "args.refreshToken" | "args.params" | "args.allowExtraProviders" | `args.params.${string}` | `args.profile.${string}` | "args.shouldLinkViaEmail" | "args.shouldLinkViaPhone" | "args.account.id" | "args.account.secret" | "args.except">;
export declare const storeImpl: (ctx: MutationCtx, fnArgs: Infer<typeof storeArgs>, getProviderOrThrow: Provider.GetProviderOrThrowFunc, config: Provider.Config) => Promise<string | void | {
    userId: import("convex/values").GenericId<"users">;
    sessionId: import("convex/values").GenericId<"authSessions">;
} | {
    token: string;
    refreshToken: string;
} | {
    account: import("../types.js").Doc<"authAccounts">;
    user: import("../types.js").Doc<"users">;
} | null>;
