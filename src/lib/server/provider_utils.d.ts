import { OAuth2Config, OAuthConfig, OAuthEndpointType, OIDCConfig } from "@auth/core/providers";
import { AuthProviderConfig, AuthProviderMaterializedConfig, ConvexAuthConfig } from "./types.js";
/**
 * @internal
 */
export declare function configDefaults(config_: ConvexAuthConfig): {
    extraProviders: AuthProviderMaterializedConfig[];
    theme: import("@auth/core/types").Theme;
    providers: (OIDCConfig<any> | OAuth2Config<any> | import("./types.js").ConvexCredentialsConfig | import("./types.js").EmailConfig<import("convex/server").GenericDataModel> | import("./types.js").PhoneConfig<import("convex/server").GenericDataModel>)[];
    session?: {
        totalDurationMs?: number;
        inactiveDurationMs?: number;
    };
    jwt?: {
        durationMs?: number;
    };
    signIn?: {
        maxFailedAttempsPerHour?: number;
    };
    callbacks?: {
        redirect?: (params: {
            redirectTo: string;
        }) => Promise<string>;
        createOrUpdateUser?: (ctx: import("convex/server").GenericMutationCtx<import("convex/server").AnyDataModel>, args: {
            existingUserId: import("convex/values").GenericId<"users"> | null;
            type: "oauth" | "credentials" | "email" | "phone" | "verification";
            provider: AuthProviderMaterializedConfig;
            profile: Record<string, unknown> & {
                email?: string;
                phone?: string;
                emailVerified?: boolean;
                phoneVerified?: boolean;
            };
            shouldLink?: boolean;
        }) => Promise<import("convex/values").GenericId<"users">>;
        afterUserCreatedOrUpdated?: (ctx: import("convex/server").GenericMutationCtx<import("convex/server").AnyDataModel>, args: {
            userId: import("convex/values").GenericId<"users">;
            existingUserId: import("convex/values").GenericId<"users"> | null;
            type: "oauth" | "credentials" | "email" | "phone" | "verification";
            provider: AuthProviderMaterializedConfig;
            profile: Record<string, unknown> & {
                email?: string;
                phone?: string;
                emailVerified?: boolean;
                phoneVerified?: boolean;
            };
            shouldLink?: boolean;
        }) => Promise<void>;
    };
};
/**
 * @internal
 */
export declare function materializeProvider(provider: AuthProviderConfig): AuthProviderMaterializedConfig;
export declare const PLACEHOLDER_URL_HOST = "convexauth.mumbojumbo";
export declare function normalizeEndpoint(e?: OAuthConfig<any>[OAuthEndpointType], issuer?: string): {
    url: URL;
    request?: undefined;
    conform?: undefined;
} | {
    url: URL;
    request: any;
    conform: any;
} | undefined;
/**
 * Deep merge two objects
 *
 * @internal
 */
export declare function merge(target: any, ...sources: any[]): any;
/**
 * @internal
 */
export declare function listAvailableProviders(config: ReturnType<typeof configDefaults>, allowExtraProviders: boolean): string;
