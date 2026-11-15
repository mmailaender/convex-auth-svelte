import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// The app owns its users table. Convex Auth keeps the auth data (passwords,
// usernames, emails, OAuth accounts, sessions) in its components, so the
// table holds only what the app shows: a display name and an avatar.
export default defineSchema({
	users: defineTable({
		// The sign-in method that created the account, e.g. `emailPassword`.
		// Each account has exactly one.
		method: v.string(),
		name: v.optional(v.string()),
		// An uploaded avatar, or the picture of the OAuth account.
		imageId: v.optional(v.id('_storage')),
		imageUrl: v.optional(v.string()),
		githubLogin: v.optional(v.string())
	}),
	messages: defineTable({
		userId: v.id('users'),
		body: v.string()
	}),
	// Emails sent while no Resend API key is set (see emails.ts).
	devEmails: defineTable({
		to: v.string(),
		subject: v.string(),
		text: v.string()
	}).index('by_to', ['to'])
});
