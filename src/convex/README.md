# Demo backend

The Convex functions of the reference app. `auth.ts` sets up every sign-in method of Convex Auth v2, `users.ts` creates the app's user rows and serves the profile, and `emails.ts` sends the emails of email + password through Resend, or into the public dev inbox with `DEV_INBOX=true`.

See [src/demo/README.md](../../demo/README.md) for the environment variables.
