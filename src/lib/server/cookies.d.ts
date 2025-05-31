export declare const SHARED_COOKIE_OPTIONS: {
    httpOnly: boolean;
    sameSite: "none";
    secure: boolean;
    path: string;
    partitioned: boolean;
};
export declare function redirectToParamCookie(providerId: string, redirectTo: string): {
    name: string;
    value: string;
    options: {
        maxAge: number;
        httpOnly: boolean;
        sameSite: "none";
        secure: boolean;
        path: string;
        partitioned: boolean;
    };
};
export declare function useRedirectToParam(providerId: string, cookies: Record<string, string | undefined>): {
    redirectTo: string;
    updatedCookie: {
        name: string;
        value: string;
        options: {
            maxAge: number;
            httpOnly: boolean;
            sameSite: "none";
            secure: boolean;
            path: string;
            partitioned: boolean;
        };
    };
} | null;
