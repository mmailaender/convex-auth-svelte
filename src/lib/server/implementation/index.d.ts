import { Auth, DocumentByName, GenericActionCtx, GenericDataModel, HttpRouter, WithoutSystemFields } from "convex/server";
import { GenericId, Value } from "convex/values";
import { FunctionReferenceFromExport, GenericDoc } from "../convex_types.js";
import { AuthProviderConfig, ConvexAuthConfig, GenericActionCtxWithAuthConfig } from "../types.js";
import { Tokens } from "./types.js";
export { authTables, Doc, Tokens } from "./types.js";
export { getAuthSessionId } from "./sessions.js";
/**
 * The type of the signIn Convex Action returned from the auth() helper.
 *
 * This type is exported for implementors of other client integrations.
 * However it is not stable, and may change until this library reaches 1.0.
 */
export type SignInAction = FunctionReferenceFromExport<ReturnType<typeof convexAuth>["signIn"]>;
/**
 * The type of the signOut Convex Action returned from the auth() helper.
 *
 * This type is exported for implementors of other client integrations.
 * However it is not stable, and may change until this library reaches 1.0.
 */
export type SignOutAction = FunctionReferenceFromExport<ReturnType<typeof convexAuth>["signOut"]>;
/**
 * The type of the isAuthenticated Convex Query returned from the auth() helper.
 *
 * This type is exported for implementors of other client integrations.
 * However it is not stable, and may change until this library reaches 1.0.
 */
export type IsAuthenticatedQuery = FunctionReferenceFromExport<ReturnType<typeof convexAuth>["isAuthenticated"]>;
/**
 * Configure the Convex Auth library. Returns an object with
 * functions and `auth` helper. You must export the functions
 * from `convex/auth.ts` to make them callable:
 *
 * ```ts filename="convex/auth.ts"
 * import { convexAuth } from "@convex-dev/auth/server";
 *
 * export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
 *   providers: [],
 * });
 * ```
 *
 * @returns An object with fields you should reexport from your
 *          `convex/auth.ts` file.
 */
export declare function convexAuth(config_: ConvexAuthConfig): {
    /**
     * Helper for configuring HTTP actions.
     */
    auth: {
        /**
         * @deprecated - Use `getAuthUserId` from "@convex-dev/auth/server":
         *
         * ```ts
         * import { getAuthUserId } from "@convex-dev/auth/server";
         * ```
         *
         * @hidden
         */
        getUserId: (ctx: {
            auth: Auth;
        }) => Promise<GenericId<"users"> | null>;
        /**
         * @deprecated - Use `getAuthSessionId` from "@convex-dev/auth/server":
         *
         * ```
         * import { getAuthSessionId } from "@convex-dev/auth/server";
         * ```
         *
         * @hidden
         */
        getSessionId: (ctx: {
            auth: Auth;
        }) => Promise<GenericId<"authSessions"> | null>;
        /**
         * Add HTTP actions for JWT verification and OAuth sign-in.
         *
         * ```ts
         * import { httpRouter } from "convex/server";
         * import { auth } from "./auth.js";
         *
         * const http = httpRouter();
         *
         * auth.addHttpRoutes(http);
         *
         * export default http;
         * ```
         *
         * The following routes are handled always:
         *
         * - `/.well-known/openid-configuration`
         * - `/.well-known/jwks.json`
         *
         * The following routes are handled if OAuth is configured:
         *
         * - `/api/auth/signin/*`
         * - `/api/auth/callback/*`
         *
         * @param http your HTTP router
         */
        addHttpRoutes: (http: HttpRouter) => void;
    };
    /**
     * Action called by the client to sign the user in.
     *
     * Also used for refreshing the session.
     */
    signIn: import("convex/server").RegisteredAction<"public", {
        provider?: string | undefined;
        verifier?: string | undefined;
        refreshToken?: string | undefined;
        params?: any;
        calledBy?: string | undefined;
    }, Promise<{
        redirect?: string;
        verifier?: string;
        tokens?: Tokens | null;
        started?: boolean;
    }>>;
    /**
     * Action called by the client to invalidate the current session.
     */
    signOut: import("convex/server").RegisteredAction<"public", {}, Promise<void>>;
    /**
     * Internal mutation used by the library to read and write
     * to the database during signin and signout.
     */
    store: import("convex/server").RegisteredMutation<"internal", {
        args: {
            sessionId?: GenericId<"authSessions"> | undefined;
            type: "signIn";
            userId: GenericId<"users">;
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
            accountId?: GenericId<"authAccounts"> | undefined;
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
            except?: GenericId<"authSessions">[] | undefined;
            type: "invalidateSessions";
            userId: GenericId<"users">;
        };
    }, Promise<string | void | {
        userId: GenericId<"users">;
        sessionId: GenericId<"authSessions">;
    } | {
        token: string;
        refreshToken: string;
    } | {
        account: import("./types.js").Doc<"authAccounts">;
        user: import("./types.js").Doc<"users">;
    } | null>>;
    /**
     * Utility function for frameworks to use to get the current auth state
     * based on credentials that they've supplied separately.
     */
    isAuthenticated: import("convex/server").RegisteredQuery<"public", {}, Promise<boolean>>;
};
/**
 * Return the currently signed-in user's ID.
 *
 * ```ts filename="convex/myFunctions.tsx"
 * import { mutation } from "./_generated/server";
 * import { getAuthUserId } from "@convex-dev/auth/server";
 *
 * export const doSomething = mutation({
 *   args: {/* ... *\/},
 *   handler: async (ctx, args) => {
 *     const userId = await getAuthUserId(ctx);
 *     if (userId === null) {
 *       throw new Error("Client is not authenticated!")
 *     }
 *     const user = await ctx.db.get(userId);
 *     // ...
 *   },
 * });
 * ```
 *
 * @param ctx query, mutation or action `ctx`
 * @returns the user ID or `null` if the client isn't authenticated
 */
export declare function getAuthUserId(ctx: {
    auth: Auth;
}): Promise<GenericId<"users"> | null>;
/**
 * Use this function from a
 * [`ConvexCredentials`](https://labs.convex.dev/auth/api_reference/providers/ConvexCredentials)
 * provider to create an account and a user with a unique account "id" (OAuth
 * provider ID, email address, phone number, username etc.).
 *
 * @returns user ID if it successfully creates the account
 * or throws an error.
 */
export declare function createAccount<DataModel extends GenericDataModel = GenericDataModel>(ctx: GenericActionCtx<DataModel>, args: {
    /**
     * The provider ID (like "password"), used to disambiguate accounts.
     *
     * It is also used to configure account secret hashing via the provider's
     * `crypto` option.
     */
    provider: string;
    account: {
        /**
         * The unique external ID for the account, for example email address.
         */
        id: string;
        /**
         * The secret credential to store for this account, if given.
         */
        secret?: string;
    };
    /**
     * The profile data to store for the user.
     * These must fit the `users` table schema.
     */
    profile: WithoutSystemFields<DocumentByName<DataModel, "users">>;
    /**
     * If `true`, the account will be linked to an existing user
     * with the same verified email address.
     * This is only safe if the returned account's email is verified
     * before the user is allowed to sign in with it.
     */
    shouldLinkViaEmail?: boolean;
    /**
     * If `true`, the account will be linked to an existing user
     * with the same verified phone number.
     * This is only safe if the returned account's phone is verified
     * before the user is allowed to sign in with it.
     */
    shouldLinkViaPhone?: boolean;
}): Promise<{
    account: GenericDoc<DataModel, "authAccounts">;
    user: GenericDoc<DataModel, "users">;
}>;
/**
 * Use this function from a
 * [`ConvexCredentials`](https://labs.convex.dev/auth/api_reference/providers/ConvexCredentials)
 * provider to retrieve a user given the account provider ID and
 * the provider-specific account ID.
 *
 * @returns the retrieved user document, or `null` if there is no account
 * for given account ID or throws if the provided
 * secret does not match.
 */
export declare function retrieveAccount<DataModel extends GenericDataModel = GenericDataModel>(ctx: GenericActionCtx<DataModel>, args: {
    /**
     * The provider ID (like "password"), used to disambiguate accounts.
     *
     * It is also used to configure account secret hashing via the provider's
     * `crypto` option.
     */
    provider: string;
    account: {
        /**
         * The unique external ID for the account, for example email address.
         */
        id: string;
        /**
         * The secret that should match the stored credential, if given.
         */
        secret?: string;
    };
}): Promise<{
    account: GenericDoc<DataModel, "authAccounts">;
    user: GenericDoc<DataModel, "users">;
}>;
/**
 * Use this function to modify the account credentials
 * from a [`ConvexCredentials`](https://labs.convex.dev/auth/api_reference/providers/ConvexCredentials)
 * provider.
 */
export declare function modifyAccountCredentials<DataModel extends GenericDataModel = GenericDataModel>(ctx: GenericActionCtx<DataModel>, args: {
    /**
     * The provider ID (like "password"), used to disambiguate accounts.
     *
     * It is also used to configure account secret hashing via the `crypto` option.
     */
    provider: string;
    account: {
        /**
         * The unique external ID for the account, for example email address.
         */
        id: string;
        /**
         * The new secret credential to store for this account.
         */
        secret: string;
    };
}): Promise<void>;
/**
 * Use this function to invalidate existing sessions.
 */
export declare function invalidateSessions<DataModel extends GenericDataModel = GenericDataModel>(ctx: GenericActionCtx<DataModel>, args: {
    userId: GenericId<"users">;
    except?: GenericId<"authSessions">[];
}): Promise<void>;
/**
 * Use this function from a
 * [`ConvexCredentials`](https://labs.convex.dev/auth/api_reference/providers/ConvexCredentials)
 * provider to sign in the user via another provider (usually
 * for email verification on sign up or password reset).
 *
 * Returns the user ID if the sign can proceed,
 * or `null`.
 */
export declare function signInViaProvider<DataModel extends GenericDataModel = GenericDataModel>(ctx: GenericActionCtxWithAuthConfig<DataModel>, provider: AuthProviderConfig, args: {
    accountId?: GenericId<"authAccounts">;
    params?: Record<string, Value | undefined>;
}): Promise<{
    userId: GenericId<"users">;
    sessionId: GenericId<"authSessions">;
} | null>;
