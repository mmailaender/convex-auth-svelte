import { ConvexAuthMaterializedConfig } from "../index.js";
export declare function redirectAbsoluteUrl(config: ConvexAuthMaterializedConfig, params: {
    redirectTo: unknown;
}): Promise<string>;
export declare function setURLSearchParam(absoluteUrl: string, param: string, value: string): string;
