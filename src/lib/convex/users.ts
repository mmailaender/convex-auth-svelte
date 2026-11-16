import { getAuthUserId } from '@convex-dev/auth/server';
import { vAppleProfile } from '@convex-dev/auth/methods/apple/server';
import { vGithubProfile } from '@convex-dev/auth/methods/github/server';
import { vGoogleProfile } from '@convex-dev/auth/methods/google/server';
import { v } from 'convex/values';
import { components } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, mutation, query, type QueryCtx } from './_generated/server';

// The union of the profiles the configured sign-in methods hand to
// `createUser`, one arm per method.
const vMethod = v.union(
	v.object({ name: v.literal('usernamePassword'), profile: v.object({}) }),
	v.object({ name: v.literal('emailPassword'), profile: v.object({}) }),
	v.object({ name: v.literal('usernamePasskey'), profile: v.object({}) }),
	v.object({ name: v.literal('github'), profile: vGithubProfile }),
	v.object({ name: v.literal('google'), profile: vGoogleProfile }),
	v.object({ name: v.literal('apple'), profile: vAppleProfile })
);

/** Called by each sign-in method the first time it sees an account. */
export const createUser = internalMutation({
	args: { method: vMethod },
	returns: v.id('users'),
	handler: async (ctx, { method }) => {
		switch (method.name) {
			case 'github':
				return await ctx.db.insert('users', {
					method: method.name,
					name: method.profile.name ?? method.profile.login,
					imageUrl: method.profile.avatarUrl,
					githubLogin: method.profile.login
				});
			case 'google':
				return await ctx.db.insert('users', {
					method: method.name,
					name: method.profile.name,
					imageUrl: method.profile.picture
				});
			case 'apple':
				return await ctx.db.insert('users', { method: method.name, name: method.profile.name });
			default:
				return await ctx.db.insert('users', { method: method.name });
		}
	}
});

/**
 * The username or email address of a user, read from the Convex Auth
 * components rather than copied into the users table, so it never drifts.
 */
async function identifiers(
	ctx: QueryCtx,
	user: Doc<'users'>
): Promise<{ username?: string | null; email?: string | null }> {
	const userId = user._id;
	switch (user.method) {
		case 'usernamePassword':
		case 'usernamePasskey':
			return {
				username: await ctx.runQuery(components.authUsername.public.getUsername, { userId })
			};
		case 'emailPassword':
			return {
				email: await ctx.runQuery(components.authEmail.verifiedEmails.getPrimaryEmail, {
					userId
				})
			};
		default:
			return {};
	}
}

/** The name to show for a user: their display name, or how they sign in. */
export async function displayName(ctx: QueryCtx, userId: Id<'users'>): Promise<string> {
	const user = await ctx.db.get('users', userId);
	if (user === null) {
		return 'Deleted user';
	}
	if (user.name) {
		return user.name;
	}
	const { username, email } = await identifiers(ctx, user);
	return username ?? email?.split('@')[0] ?? user.githubLogin ?? 'Anonymous';
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
		const image =
			user.imageId !== undefined
				? ((await ctx.storage.getUrl(user.imageId)) ?? undefined)
				: user.imageUrl;
		return {
			_id: user._id,
			method: user.method,
			name: await displayName(ctx, userId),
			image,
			githubLogin: user.githubLogin,
			...(await identifiers(ctx, user))
		};
	}
});

async function requireUser(ctx: QueryCtx): Promise<Doc<'users'>> {
	const userId = await getAuthUserId(ctx);
	const user = userId === null ? null : await ctx.db.get('users', userId);
	if (user === null) {
		throw new Error('Not signed in');
	}
	return user;
}

/** Sets the display name of the signed-in user. */
export const updateName = mutation({
	args: { name: v.string() },
	returns: v.null(),
	handler: async (ctx, { name }) => {
		const user = await requireUser(ctx);
		const trimmed = name.trim();
		if (trimmed.length === 0 || trimmed.length > 64) {
			throw new Error('A name has 1 to 64 characters.');
		}
		await ctx.db.patch('users', user._id, { name: trimmed });
		return null;
	}
});

/** A URL to upload an avatar to. */
export const generateAvatarUploadUrl = mutation({
	args: {},
	returns: v.string(),
	handler: async (ctx) => {
		await requireUser(ctx);
		return await ctx.storage.generateUploadUrl();
	}
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Sets the uploaded avatar of the signed-in user, replacing the previous one. */
export const updateAvatar = mutation({
	args: { storageId: v.id('_storage') },
	returns: v.null(),
	handler: async (ctx, { storageId }) => {
		const user = await requireUser(ctx);
		if (user.imageId === storageId) {
			return null;
		}
		const file = await ctx.db.system.get('_storage', storageId);
		if (file === null || !file.contentType?.startsWith('image/') || file.size > MAX_AVATAR_BYTES) {
			throw new Error('An avatar is an image of up to 2 MB.');
		}
		// Avatar URLs show their storage ID, so a caller could pass another
		// user's avatar, and its file would be deleted with their next change.
		const owner = await ctx.db
			.query('users')
			.withIndex('by_imageId', (q) => q.eq('imageId', storageId))
			.first();
		if (owner !== null) {
			throw new Error('That file is already in use.');
		}
		if (user.imageId !== undefined) {
			await ctx.storage.delete(user.imageId);
		}
		await ctx.db.patch('users', user._id, { imageId: storageId });
		return null;
	}
});

/** Removes the avatar of the signed-in user. */
export const removeAvatar = mutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		if (user.imageId !== undefined) {
			await ctx.storage.delete(user.imageId);
		}
		await ctx.db.patch('users', user._id, { imageId: undefined, imageUrl: undefined });
		return null;
	}
});
