import { AuthProviderMaterializedConfig } from "../index.js";
export declare function hash(provider: any, secret: string): Promise<any>;
export declare function verify(provider: AuthProviderMaterializedConfig, secret: string, hash: string): Promise<boolean>;
export type GetProviderOrThrowFunc = (provider: string, allowExtraProviders?: boolean) => AuthProviderMaterializedConfig;
export type Config = any;
