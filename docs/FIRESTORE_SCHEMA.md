# Firestore Database Schema

WildSaura Identity uses Firebase project `wildsaura-1ef8a` and preserves all existing collections during the transition.

## Existing Collections

### `users/`
Canonical identity source of truth for Identity UI.

```json
{
  "uid": "uid",
  "email": "string",
  "displayName": "string",
  "photoURL": "string",
  "username": "string",
  "phone": "string",
  "address": "string",
  "province": "string",
  "country": "string",
  "dateOfBirth": "string",
  "gender": "string",
  "verified": false,
  "verificationStatus": "not_started | pending | verified | rejected",
  "connectedApps": {
    "identity": { "connected": true, "firstSeen": "<timestamp>", "lastSeen": "<timestamp>" },
    "market": { "connected": true, "firstSeen": "<timestamp>", "lastSeen": "<timestamp>" },
    "drishya": { "connected": true, "firstSeen": "<timestamp>", "lastSeen": "<timestamp>" },
    "community": { "connected": true, "firstSeen": "<timestamp>", "lastSeen": "<timestamp>" },
    "creator": { "connected": true, "firstSeen": "<timestamp>", "lastSeen": "<timestamp>" }
  },
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

Legacy boolean connected app values are still supported while records migrate to metadata objects.

### `users/{uid}/sessions/`
Scoped session tracking for the Identity dashboard.

```json
{
  "device": "Desktop | Mobile",
  "browser": "string",
  "platform": "string",
  "createdAt": "<timestamp>",
  "lastSeen": "<timestamp>",
  "active": true
}
```

### `profiles/`
Legacy Drishya-compatible profile collection. It is still synchronized for backward compatibility.

```json
{
  "id": "uid",
  "username": "string",
  "display_name": "string",
  "avatar_url": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "province": "string",
  "country": "string",
  "date_of_birth": "string",
  "gender": "string",
  "terms_accepted": true,
  "verification_status": "not_started | pending | verified | rejected",
  "is_verified": false,
  "verified_at": "<timestamp|null>",
  "verification_badge": "none | verified",
  "id_proof_url": "string|null"
}
```

### `verifications/`
Verification request and document workflow data.

```json
{
  "uid": "uid",
  "fullName": "string",
  "country": "string",
  "documentUrl": "string",
  "status": "not_started | pending | verified | rejected",
  "submittedAt": "<timestamp>",
  "reviewedAt": "<timestamp|null>",
  "reviewedBy": "uid-or-email"
}
```

### `verifications/{uid}/auditLogs/`
Verification-specific audit trail written when reviewer/admin status changes occur.

### `usernames/`
Username uniqueness index.

### `referrals/`
Drishya referral tracking. Existing referral behavior is preserved.

## Status Normalization

Canonical values:

- `not_started`
- `pending`
- `verified`
- `rejected`

Legacy mappings:

- `approved` → `verified`
- `none` → `not_started`
- `null` / missing → `not_started`
