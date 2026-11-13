import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// The app owns its users table. Convex Auth keeps the auth data (passwords,
// usernames, GitHub accounts, sessions) in its components.
export default defineSchema({
	users: defineTable({
		githubLogin: v.optional(v.string()),
		image: v.optional(v.string())
	}),
	messages: defineTable({
		userId: v.id('users'),
		body: v.string()
	})
});
