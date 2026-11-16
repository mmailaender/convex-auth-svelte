# Run the e2e tests

The tests run the demo app (`pnpm build && pnpm preview`) against the Convex
deployment in `.env.local`. They create their own users through the sign-up
page, so they need no seeded data or secrets.

1. Push the demo backend in `src/lib/convex` to a dev deployment:

   ```
   # Any value works for the tests: they stop at the provider's page.
   for k in AUTH_GITHUB_CLIENT_ID AUTH_GITHUB_CLIENT_SECRET AUTH_GOOGLE_CLIENT_ID \
     AUTH_GOOGLE_CLIENT_SECRET AUTH_APPLE_CLIENT_ID AUTH_APPLE_TEAM_ID \
     AUTH_APPLE_KEY_ID AUTH_APPLE_PRIVATE_KEY; do npx convex env set $k test; done
   npx convex dev --once
   ```

   Turn on the dev inbox and leave `RESEND_API_KEY` unset: the email tests read their links from the dev inbox.

   ```bash
   npx convex env set DEV_INBOX true
   ```

   `npx convex dev` also writes `PUBLIC_CONVEX_URL` to `.env.local`.

1. Run `pnpm test:e2e`. To run beside another preview server, pick a port with `E2E_PORT=4180`, and add its origin to the backend with `npx convex env set SITE_URL http://localhost:4180`, so OAuth may redirect back to it.
