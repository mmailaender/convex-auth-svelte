---
'@mmailaender/convex-auth-svelte': patch
---

Chore: Upgrade dependencies to pull in security fixes, most importantly `path-to-regexp@^8.4.2`, which includes fixes for ReDoS/DoS advisories affecting `8.0.0` through `<8.4.0` (CVE-2026-4923 and CVE-2026-4926). Also refreshes `cookie` and `is-network-error` to their latest patched ranges.
