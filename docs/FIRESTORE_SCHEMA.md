# Firestore Database Schema

WildSaura Identity uses Firebase project `wildsaura-1ef8a` and keeps the existing collections during consolidation:

- `users`
- `profiles`
- `verifications`
- `usernames`
- `referrals`

No existing collection is deleted during the transition.

## Canonical identity record

### `users/{uid}`

`users/{uid}` is the canonical Identity source of truth. Existing Drishya-era fields in `profiles/{uid}` remain supported as legacy fallback data.

```json
{
  "uid": "uid",
  "email": "user@example.com",
  "displayName": "Display Name",
  "photoURL": "https://...",
  "username": "username",
  "phone": "+977...",
  "address": "city/village",
  "province": "Province",
  "country": "Nepal",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "male|female|other|prefer_not_to_say",
  "verified": false,
  "verificationStatus": "not_started",
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

Canonical verification values:

```txt
not_started
pending
verified
rejected
```

Legacy status mapping:

| Legacy value | Canonical value |
| --- | --- |
| `approved` | `verified` |
| `none` | `not_started` |
| `null` / missing | `not_started` |

## Legacy-compatible profile record

### `profiles/{uid}`

`profiles/{uid}` remains supported for Drishya compatibility and is synchronized with canonical `users/{uid}` for identity and verification fields.

```json
{
  "id": "uid",
  "username": "username",
  "display_name": "Display Name",
  "avatar_url": "https://...",
  "email": "user@example.com",
  "phone": "+977...",
  "address": "city/village",
  "province": "Province",
  "country": "Nepal",
  "date_of_birth": "YYYY-MM-DD",
  "gender": "male|female|other|prefer_not_to_say",
  "terms_accepted": true,
  "terms_accepted_at": "<timestamp>",
  "verification_status": "not_started",
  "is_verified": false,
  "verified_at": null,
  "verification_badge": "none",
  "id_proof_url": null,
  "created_at": "<timestamp>",
  "updated_at": "<timestamp>"
}
```

## Verification requests

### `verifications/{uid}`

Stores verification submission and review metadata. Admin status changes synchronize this document with both `users/{uid}` and `profiles/{uid}` in one transaction.

```json
{
  "uid": "uid",
  "fullName": "string",
  "country": "string",
  "documentUrl": "string",
  "status": "pending",
  "submittedAt": "<timestamp>",
  "reviewedAt": null,
  "reviewedBy": null,
  "updatedAt": "<timestamp>"
}
```

### `verifications/{uid}/auditLogs/{logId}`

Stores verification review audit events without adding a new top-level collection.

```json
{
  "action": "verification_verified",
  "status": "verified",
  "message": "Admin marked verification verified",
  "reviewerUid": "admin uid",
  "reviewerEmail": "admin@example.com",
  "createdAt": "<timestamp>"
}
```

## Sessions

### `users/{uid}/sessions/{sessionId}`

Tracks Identity sessions under the canonical user record.

```json
{
  "device": "Desktop",
  "browser": "Chrome",
  "platform": "Linux x86_64",
  "createdAt": "<timestamp>",
  "lastSeen": "<timestamp>",
  "active": true
}
```

## Username index

### `usernames/{username}`

```json
{
  "uid": "uid",
  "created_at": "<timestamp>"
}
```

## Referrals

### `referrals/{autoId}`

```json
{
  "referrerId": "uid",
  "refereeId": "uid",
  "code": "DRSHABC123",
  "createdAt": "<timestamp>",
  "pointsAwarded": 50
}
```
