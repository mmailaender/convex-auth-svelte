import { getAuthUserId } from '@convex-dev/auth/server';
import { vGithubProfile } from '@convex-dev/auth/methods/github/server';
import { v } from 'convex/values';
import { components } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { internalMutation, query, type QueryCtx } from './_generated/server';

// The union of the profiles the configured sign-in methods hand to `createUser`.
const vMethod = v.union(
	v.object({ name: v.literal('usernamePassword'), profile: v.object({}) }),
	v.object({ name: v.literal('github'), profile: vGithubProfile })
);

/** Called by each sign-in method the first time it sees an account. */
export const createUser = internalMutation({
	args: { method: vMethod },
	returns: v.id('users'),
	handler: async (ctx, { method }) => {
		return await ctx.db.insert(
			'users',
			method.name === 'github'
				? { githubLogin: method.profile.login, image: method.profile.avatarUrl }
				: {}
		);
	}
});

/** The display name of a user: the GitHub login, or the username. */
export async function displayName(ctx: QueryCtx, userId: Id<'users'>): Promise<string> {
	const user = await ctx.db.get('users', userId);
	if (user?.githubLogin !== undefined) {
		return user.githubLogin;
	}
	const username = await ctx.runQuery(components.authUsername.public.getUsername, { userId });
	return username ?? 'Anonymous';
}

/** The signed-in user, or null. */
export const viewer = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (userId === null) {
			return null;
		}
		const user = await ctx.db.get('users', userId);
		if (user === null) {
			return null;
		}
		return { _id: user._id, name: await displayName(ctx, userId), image: user.image };
	}
});
