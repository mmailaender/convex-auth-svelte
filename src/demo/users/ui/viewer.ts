import type { FunctionReturnType } from 'convex/server';
import type { api } from '$convex/_generated/api';

/** The signed-in user, as `api.users.viewer` returns it. */
export type Viewer = NonNullable<FunctionReturnType<typeof api.users.viewer>>;

/** How the user signs in: their username or email, or the OAuth provider. */
export function viewerIdentifier(viewer: Viewer): string {
	return viewer.email ?? viewer.username ?? (viewer.githubLogin ? `@${viewer.githubLogin}` : '');
}
