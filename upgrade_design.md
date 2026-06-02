# Identity.wildsaura Upgrade Design

The repository already contains a Firebase-backed identity adapter that merges `users/{uid}`, `profiles/{uid}`, and `verifications/{uid}`. The upgrade will keep this data contract instead of creating a parallel model. The new experience will position `identity.wildsaura` as the central WildSaura ecosystem verification junction for Identity, Market, Drishya, Community, and Creator Hub.

| Area | Upgrade Direction |
|---|---|
| Login | Replace the current Google-only sign-in card with a proper login screen containing email/password login, Google login, forgot-password access, and a visible sign-up path. |
| Dashboard | Rebuild `/dashboard` as a junction-style command center with user profile summary, verification status, ecosystem access cards, completion checklist, security, sessions, and activity. |
| Profile | Add `/profile` so users can view and update their identity fields using the existing `ensureIdentityRecordsForAuthUser` write contract. |
| Verification | Upgrade `/verify` from a simple three-field wizard to a professional verification request flow with document type, ID/reference number, country, notes, review summary, and safer validation. |
| Navigation | Expand protected navigation to Dashboard, Profile, Verification, Apps, Status, Security, and Admin when available. |

Because `madan123051/lumina` was not accessible through the configured GitHub account, the implementation will use the existing Lumina-compatible Firebase client and current profile/onboarding model already present in this repository. The source includes comments and adapters explicitly describing compatibility with the Lumina auth model.
