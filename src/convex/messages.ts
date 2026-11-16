import { getAuthUserId } from '@convex-dev/auth/server';
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { displayName } from './users';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (userId === null) {
			throw new Error('Not signed in');
		}
		// Grab the most recent messages.
		const messages = await ctx.db.query('messages').order('desc').take(100);
		// Reverse the list so that it's in a chronological order.
		return Promise.all(
			messages.reverse().map(async (message) => ({
				...message,
				author: await displayName(ctx, message.userId)
			}))
		);
	}
});

export const send = mutation({
	args: { body: v.string() },
	handler: async (ctx, { body }) => {
		const userId = await getAuthUserId(ctx);
		if (userId === null) {
			throw new Error('Not signed in');
		}
		await ctx.db.insert('messages', { body, userId });
	}
});
