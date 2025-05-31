import { ConvexClient, ConvexClientOptions } from "convex/browser";
import { ConvexAuthServerState } from "../svelte/index.svelte";
/**
 * Create a Convex Auth client for SvelteKit
 */
export declare function createSvelteKitAuthClient({ apiRoute, getServerState: getServerState, storage, storageNamespace, client, convexUrl, options, }: {
    apiRoute?: string;
    getServerState: () => ConvexAuthServerState;
    storage?: "localStorage" | "inMemory";
    storageNamespace?: string;
    client?: ConvexClient;
    convexUrl?: string;
    options?: ConvexClientOptions;
}): {
    readonly isLoading: boolean;
    readonly isAuthenticated: boolean;
    readonly token: string | null;
    fetchAccessToken: (options?: {
        forceRefreshToken?: boolean;
    }) => Promise<string | null>;
    signIn: (provider: string, params?: FormData | Record<string, import("convex/values").Value>) => Promise<{
        signingIn: boolean;
        redirect: URL;
    } | {
        signingIn: boolean;
        redirect?: undefined;
    }>;
    signOut: () => Promise<void>;
};
