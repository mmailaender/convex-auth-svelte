import { AuthClient } from "./clientType.js";
import type { ConvexAuthServerState, TokenStorage } from "./index.svelte.js";
import { Value } from "convex/values";
import { ConvexClient, ConvexClientOptions } from "convex/browser";
/**
 * Create a Convex Auth client with Svelte reactivity
 */
export declare function createAuthClient({ client, getServerState, onChange, storage, storageNamespace, replaceURL, options, }: {
    client: AuthClient;
    getServerState?: () => ConvexAuthServerState;
    onChange?: () => Promise<unknown>;
    storage: TokenStorage | null;
    storageNamespace: string;
    replaceURL: (relativeUrl: string) => void | Promise<void>;
    options?: ConvexClientOptions;
}): {
    readonly isLoading: boolean;
    readonly isAuthenticated: boolean;
    readonly token: string | null;
    fetchAccessToken: (options?: {
        forceRefreshToken?: boolean;
    }) => Promise<string | null>;
    signIn: (provider: string, params?: FormData | Record<string, Value>) => Promise<{
        signingIn: boolean;
        redirect: URL;
    } | {
        signingIn: boolean;
        redirect?: undefined;
    }>;
    signOut: () => Promise<void>;
};
/**
 * Get the Convex Auth client from the context
 */
export declare function useAuth(): {};
/**
 * Set the Convex Auth client in the context
 */
export declare function setConvexAuthContext(authClient: ReturnType<typeof createAuthClient>): {
    readonly isLoading: boolean;
    readonly isAuthenticated: boolean;
    readonly token: string | null;
    fetchAccessToken: (options?: {
        forceRefreshToken?: boolean;
    }) => Promise<string | null>;
    signIn: (provider: string, params?: FormData | Record<string, Value>) => Promise<{
        signingIn: boolean;
        redirect: URL;
    } | {
        signingIn: boolean;
        redirect?: undefined;
    }>;
    signOut: () => Promise<void>;
};
/**
 * Get the Convex Auth client from the context
 */
export declare function getConvexAuthContext(): {
    readonly isLoading: boolean;
    readonly isAuthenticated: boolean;
    readonly token: string | null;
    fetchAccessToken: (options?: {
        forceRefreshToken?: boolean;
    }) => Promise<string | null>;
    signIn: (provider: string, params?: FormData | Record<string, Value>) => Promise<{
        signingIn: boolean;
        redirect: URL;
    } | {
        signingIn: boolean;
        redirect?: undefined;
    }>;
    signOut: () => Promise<void>;
};
export declare function browserMutex<T>(key: string, callback: () => Promise<T>): Promise<T>;
export declare const setupConvexClient: (convexUrl: string, options?: ConvexClientOptions) => ConvexClient;
