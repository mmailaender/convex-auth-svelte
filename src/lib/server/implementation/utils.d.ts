export declare const TOKEN_SUB_CLAIM_DIVIDER = "|";
export declare const REFRESH_TOKEN_DIVIDER = "|";
export declare function stringToNumber(value: string | undefined): number | undefined;
export declare function sha256(input: string): Promise<string>;
export declare function logError(error: unknown): void;
export declare const LOG_LEVELS: {
    readonly ERROR: "ERROR";
    readonly WARN: "WARN";
    readonly INFO: "INFO";
    readonly DEBUG: "DEBUG";
};
type LogLevel = keyof typeof LOG_LEVELS;
export declare function logWithLevel(level: LogLevel, ...args: unknown[]): void;
export declare function maybeRedact(value: string): string;
export {};
