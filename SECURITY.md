# Tavsi security operations

## Production status

1. Completed on 2026-09-20: applied
   `supabase/migrations/202609200001_security_hardening.sql` to production and
   verified the hardened RLS/grant configuration.
2. Completed on 2026-09-20: disabled the legacy JWT-based API keys and revoked
   the previous HS256 signing key. The `service_role` JWT committed in Git
   commit `eb4723b` is no longer trusted by Supabase.
3. Completed on 2026-09-20: removed `scripts/import_places.js` from all
   reachable historical commits, force-pushed the rewritten `master` branch
   with lease protection, aligned the local branch, and pruned the old local
   objects. The revoked JWT no longer appears in reachable Git history.
4. Store the replacement key only in a server-side secret manager. Import
   scripts require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` at runtime;
   never expose the secret to Expo `EXPO_PUBLIC_*` variables or client code.
5. Migration `supabase/migrations/202609200002_drop_legacy_trust_network.sql`
   created to safely drop the obsolete `trust_network` table, clearing the
   Supabase Advisor RLS notice.
6. Client-side authentication hardened:
   - Minimum 8-character password enforcement with uppercase, lowercase, and digit requirements.
   - Live visual requirement validation indicators on signup.
   - Password reset flow ("Şifremi Unuttum") integrated with `supabase.auth.resetPasswordForEmail`.
   - Secure password change flow in Privacy Center requiring current password verification before updating.

## Supabase Dashboard Hardening Checklist

The following settings must be configured in the Supabase Dashboard:

1. **Authentication -> Password & Security**:
   - **Minimum password length**: Set to at least `8` (recommended `10`).
   - **Password Requirements**:
     - Check: *Require at least one lowercase letter*
     - Check: *Require at least one uppercase letter*
     - Check: *Require at least one digit*
     - Check: *Require at least one symbol*
   - **Secure password change**: Enable *Require user's current password to update password*.
   - **Leaked password protection (HaveIBeenPwned)**: Enable under Pro plan.
2. **Authentication -> Bot Detection / CAPTCHA**:
   - Enable Cloudflare Turnstile or hCaptcha to protect signup/login endpoints against credential stuffing and automated bot activity.

## Verification & Advisory Notes

- `npm run typecheck`
- `npx expo install --check`
- `npx expo-doctor`
- `npm audit --omit=dev`

### NPM uuid@7.0.3 Advisory (GHSA-w5hq-g745-h8pq)
- **Status:** Non-runtime dependency artifact.
- **Analysis:** This dependency originates strictly from `xcode` (used by `@expo/config-plugins` for iOS project file parsing during native build time). It is completely excluded from the bundled mobile application JavaScript runtime and native binaries.
- **Action:** Do NOT execute `npm audit fix --force`, as it attempts an incompatible downgrade to Expo SDK 46.

### Expo SDK 56 Hermes Memory Regression
- **Status:** Known upstream React Native Hermes V1 issue.
- **Analysis:** This is an availability / stability regression (memory leak during long sessions leading to potential OOM crashes on low-spec devices), not a data confidentiality or integrity exploit.
- **Action:** Upgrading to Expo SDK 57 (`expo@^57.0.17+` with React Native `0.86.2+`) is recommended as part of the next scheduled SDK release cycle.
