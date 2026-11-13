/** Where the auth routes of the SvelteKit server are mounted. */
export type ConvexAuthRoutes = {
	/** The auth proxy that serves every sign-in function. */
	signIn: string;
	/** Refreshes the access token from the httpOnly refresh-token cookie. */
	refresh: string;
	/** Revokes the session and clears the cookies. */
	signOut: string;
};

export const DEFAULT_ROUTES: ConvexAuthRoutes = {
	signIn: '/auth/signin',
	refresh: '/auth/refresh',
	signOut: '/auth/signout'
};

/**
 * What the server hands the client: the access token of the request, or
 * `null` when signed out. The refresh token stays in its httpOnly cookie.
 */
export type ConvexAuthServerState = {
	token: string | null;
};
