# Firestore Database Schema

## Collections

### `users/`
Stores user profile and connection data.

```json
{
  "displayName": "string",
  "photoURL": "string",
  "verified": false,
  "verificationStatus": "not_started",
  "connectedApps": { "market": true },
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

### `verifications/`
Stores verification submission data.

```json
{
  "uid": "uid",
  "fullName": "string",
  "country": "string",
  "documentUrl": "string",
  "status": "pending",
  "submittedAt": "<timestamp>",
  "reviewedAt": null
}
```
