import { ConvexHttpClient } from "convex/browser";
export declare function logVerbose(message: string, verbose?: boolean): void;
/**
 * Options to {@link preloadQuery}, {@link fetchQuery}, {@link fetchMutation} and {@link fetchAction}.
 */
export type SveltekitOptions = {
    /**
     * The JWT-encoded OpenID Connect authentication token to use for the function call.
     */
    token?: string;
    /**
     * The URL of the Convex deployment to use for the function call.
     * Defaults to `process.env.NEXT_PUBLIC_CONVEX_URL`.
     */
    url?: string;
    /**
     * @internal
     */
    adminToken?: string;
    /**
     * Skip validating that the Convex deployment URL looks like
     * `https://happy-animal-123.convex.cloud` or localhost.
     *
     * This can be useful if running a self-hosted Convex backend that uses a different
     * URL.
     *
     * The default value is `false`
     */
    skipConvexDeploymentUrlCheck?: boolean;
};
export declare function setupClient(options?: SveltekitOptions): ConvexHttpClient;
/**
 * Helper to get the Convex URL from environment variables
 * This allows SvelteKit implementations to automatically use the URL
 */
export declare function getConvexUrl(deploymentUrl?: string, skipConvexDeploymentUrlCheck?: boolean): string;
export declare function validateDeploymentUrl(deploymentUrl: string): void;
export declare function isCorsRequest(request: Request): boolean;
