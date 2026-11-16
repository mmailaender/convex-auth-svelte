import { v } from 'convex/values';
import { components } from './_generated/api';
import { env, internalMutation, query } from './_generated/server';

// The arguments of `components.resend.lib.sendEmail`, which the email
// component calls through a function handle.
const vSendEmailArgs = {
	options: v.object({
		apiKey: v.string(),
		initialBackoffMs: v.number(),
		retryAttempts: v.number(),
		testMode: v.boolean(),
		onEmailEvent: v.optional(v.object({ fnHandle: v.string() }))
	}),
	from: v.string(),
	to: v.array(v.string()),
	cc: v.optional(v.array(v.string())),
	bcc: v.optional(v.array(v.string())),
	subject: v.optional(v.string()),
	html: v.optional(v.string()),
	text: v.optional(v.string()),
	replyTo: v.optional(v.array(v.string())),
	headers: v.optional(v.array(v.object({ name: v.string(), value: v.string() }))),
	idempotencyKey: v.optional(v.string()),
	template: v.optional(
		v.object({
			id: v.string(),
			variables: v.optional(v.record(v.string(), v.union(v.string(), v.number())))
		})
	)
};

/**
 * Whether emails go to the dev inbox instead of Resend. It takes an explicit
 * `DEV_INBOX=true`, so a deployment that's only missing its Resend key fails
 * to send instead of publishing its emails.
 */
function devInbox(): boolean {
	return env.RESEND_API_KEY === undefined && env.DEV_INBOX === 'true';
}

/**
 * Sends an email of Convex Auth: through Resend when `RESEND_API_KEY` is
 * set, or into the `devEmails` table with `DEV_INBOX=true`, so the demo runs
 * without a Resend account. Passed to `setupEmailPassword` in place of
 * Resend's `sendEmail`.
 */
export const send = internalMutation({
	args: vSendEmailArgs,
	returns: v.string(),
	handler: async (ctx, args) => {
		if (env.RESEND_API_KEY !== undefined) {
			return await ctx.runMutation(components.resend.lib.sendEmail, args);
		}
		if (!devInbox()) {
			throw new Error(
				'Set RESEND_API_KEY to send emails, or DEV_INBOX=true to keep them in the public dev inbox.'
			);
		}
		const to = args.to.join(', ').toLowerCase();
		return await ctx.db.insert('devEmails', {
			to,
			subject: args.subject ?? '',
			text: args.text ?? args.html ?? ''
		});
	}
});

/** Whether the dev inbox is on, for showing its link. */
export const inboxEnabled = query({
	args: {},
	returns: v.boolean(),
	handler: async () => devInbox()
});

/**
 * The emails in the dev inbox, newest first. Empty unless the dev inbox is on.
 *
 * Anyone can read the dev inbox, including the sign-in links in it, so never
 * set `DEV_INBOX` on a deployment with real users.
 */
export const inbox = query({
	args: { to: v.optional(v.string()) },
	handler: async (ctx, { to }) => {
		if (!devInbox()) {
			return { enabled: false as const, emails: [] };
		}
		const emails =
			to === undefined
				? await ctx.db.query('devEmails').order('desc').take(50)
				: await ctx.db
						.query('devEmails')
						.withIndex('by_to', (q) => q.eq('to', to.trim().toLowerCase()))
						.order('desc')
						.take(50);
		return { enabled: true as const, emails };
	}
});
