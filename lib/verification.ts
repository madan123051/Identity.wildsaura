import {
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

export type VerificationStatus = "not_started" | "pending" | "verified" | "rejected";

const CANONICAL_STATUSES: VerificationStatus[] = [
  "not_started",
  "pending",
  "verified",
  "rejected",
];

export function normalizeVerificationStatus(
  value?: unknown,
  legacyVerified?: unknown
): VerificationStatus {
  if (legacyVerified === true) return "verified";

  if (typeof value !== "string" || !value.trim()) return "not_started";

  const normalized = value.trim().toLowerCase();
  if (normalized === "approved") return "verified";
  if (normalized === "none" || normalized === "null") return "not_started";
  if (CANONICAL_STATUSES.includes(normalized as VerificationStatus)) {
    return normalized as VerificationStatus;
  }

  return "not_started";
}

export function isVerifiedStatus(status: VerificationStatus): boolean {
  return status === "verified";
}

export function getVerificationLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    not_started: "Not Started",
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
  };
  return labels[status];
}

export async function syncVerificationStatus(
  db: Firestore,
  uid: string,
  nextStatus: VerificationStatus,
  reviewer?: { uid?: string; email?: string | null }
) {
  const status = normalizeVerificationStatus(nextStatus);
  const verified = isVerifiedStatus(status);
  const userRef = doc(db, "users", uid);
  const profileRef = doc(db, "profiles", uid);
  const verificationRef = doc(db, "verifications", uid);
  const auditRef = doc(verificationRef, "auditLogs", crypto.randomUUID());

  await runTransaction(db, async (transaction) => {
    const [userSnap, profileSnap, verificationSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(profileRef),
      transaction.get(verificationRef),
    ]);

    const existingUser = userSnap.exists() ? userSnap.data() : {};
    const existingProfile = profileSnap.exists() ? profileSnap.data() : {};
    const existingVerification = verificationSnap.exists() ? verificationSnap.data() : {};
    const now = serverTimestamp();
    const reviewFields =
      status === "verified" || status === "rejected"
        ? {
            reviewedAt: now,
            reviewedBy: reviewer?.uid || reviewer?.email || null,
            reviewerEmail: reviewer?.email || null,
          }
        : {};

    transaction.set(
      userRef,
      {
        ...(!userSnap.exists() ? { uid } : {}),
        email: existingUser.email || existingProfile.email || existingVerification.email || null,
        displayName:
          existingUser.displayName ||
          existingUser.fullName ||
          existingVerification.fullName ||
          existingProfile.display_name ||
          existingProfile.displayName ||
          null,
        fullName:
          existingUser.fullName ||
          existingVerification.fullName ||
          existingUser.displayName ||
          existingProfile.display_name ||
          null,
        country: existingUser.country || existingVerification.country || existingProfile.country || null,
        documentUrl:
          existingUser.documentUrl ||
          existingUser.documentURL ||
          existingVerification.documentUrl ||
          existingVerification.documentURL ||
          existingProfile.id_proof_url ||
          null,
        documentURL:
          existingUser.documentURL ||
          existingUser.documentUrl ||
          existingVerification.documentURL ||
          existingVerification.documentUrl ||
          existingProfile.id_proof_url ||
          null,
        verificationStatus: status,
        verified,
        ...(status === "verified" ? { verifiedAt: existingUser.verifiedAt || now } : {}),
        ...reviewFields,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.set(
      profileRef,
      {
        ...(!profileSnap.exists() ? { id: uid } : {}),
        email: existingProfile.email || existingUser.email || existingVerification.email || null,
        display_name:
          existingProfile.display_name ||
          existingUser.displayName ||
          existingUser.fullName ||
          existingVerification.fullName ||
          null,
        country: existingProfile.country || existingUser.country || existingVerification.country || null,
        id_proof_url:
          existingProfile.id_proof_url ||
          existingUser.documentUrl ||
          existingUser.documentURL ||
          existingVerification.documentUrl ||
          existingVerification.documentURL ||
          null,
        verification_status: status,
        is_verified: verified,
        ...(status === "verified" ? { verified_at: existingProfile.verified_at || now } : {}),
        verification_badge:
          status === "verified"
            ? existingProfile.verification_badge || "identity"
            : existingProfile.verification_badge || "none",
        updated_at: now,
      },
      { merge: true }
    );

    transaction.set(
      verificationRef,
      {
        uid,
        fullName:
          existingVerification.fullName ||
          existingUser.fullName ||
          existingUser.displayName ||
          existingProfile.display_name ||
          null,
        country: existingVerification.country || existingUser.country || existingProfile.country || null,
        documentUrl:
          existingVerification.documentUrl ||
          existingVerification.documentURL ||
          existingUser.documentUrl ||
          existingUser.documentURL ||
          existingProfile.id_proof_url ||
          null,
        status,
        ...reviewFields,
        updatedAt: now,
      },
      { merge: true }
    );

    transaction.set(auditRef, {
      uid,
      status,
      reviewerUid: reviewer?.uid || null,
      reviewerEmail: reviewer?.email || null,
      createdAt: now,
      source: "identity-admin-dashboard",
    });
  });
}
