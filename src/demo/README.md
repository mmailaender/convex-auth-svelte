# Reference app

The demo in `src/routes` is a reference app for Convex Auth v2 on Svelte: it has UI for every sign-in method the library supports, and the account management that comes with each. The components live here, in `src/demo`. They aren't part of the published package: copy the ones you need into your app and adapt them.

The look and the primitives come from [Convex Better Auth UI](https://github.com/mmailaender/Convex-Better-Auth-UI): Skeleton 5, Ark UI and Tailwind 4.

## What's in here

| Path                                  | What it does                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `auth/config.ts`                      | Which methods the sign-in card offers, and its branding                                            |
| `auth/errors.ts`                      | One message per Convex Auth error code                                                             |
| `auth/ui/SignIn.svelte`               | The sign-in card: OAuth buttons, then a tab per credential method, with one sign-in/sign-up toggle |
| `auth/ui/EmailPasswordForm.svelte`    | Email + password: sign in, sign up with a validation link, request a reset link                    |
| `auth/ui/UsernamePasswordForm.svelte` | Username + password: sign in and sign up                                                           |
| `auth/ui/SocialButtons.svelte`        | GitHub, Google and Apple                                                                           |
| `users/ui/UserButton.svelte`          | The avatar menu in the header                                                                      |
| `users/ui/ProfileDialog.svelte`       | The account dialog, open while the URL has `?dialog=profile`                                       |
| `users/ui/UserProfile.svelte`         | Name and avatar, and the sections that fit how the account signs in: change email, change password |
| `ui/AppShell.svelte`                  | The header and the profile dialog around every page                                                |
| `primitives/`                         | Dialog, popover, tabs, password input with a strength meter, avatar, image cropper and toasts      |

The pages that emailed links open are in `src/routes/(kit)`: `validate-email`, `reset-password` and `confirm-email-change`. `/.well-known/change-password` leads to the account dialog, so password managers find it.

Each account has exactly one sign-in method: Convex Auth v2 doesn't link methods yet. The app stores it in `users.method` when `createUser` runs, and the account dialog shows the sections for that method.

## Run it

The backend in `src/convex` sets up every method, so the deployment needs the credentials of each OAuth provider. For local work any value starts the backend, and only that provider's button fails:

```bash
npx convex env set AUTH_GITHUB_CLIENT_ID <id>
npx convex env set AUTH_GITHUB_CLIENT_SECRET <secret>
npx convex env set AUTH_GOOGLE_CLIENT_ID <id>
npx convex env set AUTH_GOOGLE_CLIENT_SECRET <secret>
npx convex env set AUTH_APPLE_CLIENT_ID <services id>
npx convex env set AUTH_APPLE_TEAM_ID <team id>
npx convex env set AUTH_APPLE_KEY_ID <key id>
npx convex env set AUTH_APPLE_PRIVATE_KEY "$(cat AuthKey_<key id>.p8)"
pnpm dev
```

Register `https://<deployment>.convex.site/oauth/<provider>/callback` as the callback URL with each provider.

### Emails

Emails go through Resend once you set it up:

```bash
npx convex env set RESEND_API_KEY <key>
npx convex env set SENDER_EMAIL auth@your-domain.com   # a domain verified with Resend
npx convex env set SITE_URL https://your-app.com        # where the emailed links point
```

`SITE_URL` defaults to `http://localhost:5173`. Its domain is also the passkeys' relying party (`rpId`): a passkey only works on the domain it was made on, so set `SITE_URL` before anyone creates one.

To try the email flows without a Resend account, run `npx convex env set DEV_INBOX true`. The backend then stores the emails instead of sending them, and `/dev/inbox` shows them with their links, rewritten to the origin you open it on. That's how the e2e tests read them. Anyone can read that page, links included, so never set `DEV_INBOX` on a deployment with real users. With neither `RESEND_API_KEY` nor `DEV_INBOX`, sending an email fails.
