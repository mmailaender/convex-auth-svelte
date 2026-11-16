# Run the e2e tests

The tests run the demo app (`pnpm build && pnpm preview`) against the Convex
deployment in `.env.local`. They create their own users through the sign-up
page, so they need no seeded data or secrets.

1. Push the demo backend in `src/convex` to a dev deployment:

   ```
   npx convex env set AUTH_GITHUB_CLIENT_ID <id>      # any value works for the tests
   npx convex env set AUTH_GITHUB_CLIENT_SECRET <secret>
   npx convex dev --once
   ```

   `npx convex dev` also writes `PUBLIC_CONVEX_URL` to `.env.local`.

1. Run `pnpm test:e2e`.
