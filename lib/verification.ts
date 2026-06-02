import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { isVerifiedFromStatus, normalizeVerificationStatus, type VerificationStatus } from './identity';

export function verificationPayload(statusInput: unknown) {
  const status = normalizeVerificationStatus(statusInput);
  const verified = isVerifiedFromStatus(status);
  return { status, verified };
}

export async function syncVerificationStatusTransaction(params: {
  db: Firestore;
  uid: string;
  status: VerificationStatus;
  reviewer?: { uid?: string; email?: string | null };
  auditMessage?: string;
}) {
  const { db, uid, status, reviewer, auditMessage } = params;
  const verified = isVerifiedFromStatus(status);
  const userRef = doc(db, 'users', uid);
  const profileRef = doc(db, 'profiles', uid);
  const verificationRef = doc(db, 'verifications', uid);
  const auditRef = doc(collection(db, 'verifications', uid, 'auditLogs'));

  await runTransaction(db, async (transaction) => {
    transaction.set(userRef, {
      verificationStatus: status,
      verified,
      reviewedAt: status === 'verified' || status === 'rejected' ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(profileRef, {
      verification_status: status,
      is_verified: verified,
      verified_at: verified ? serverTimestamp() : null,
      verification_badge: verified ? 'verified' : 'none',
      updated_at: serverTimestamp(),
    }, { merge: true });

    transaction.set(verificationRef, {
      uid,
      status,
      reviewedAt: status === 'verified' || status === 'rejected' ? serverTimestamp() : null,
      reviewedBy: reviewer?.uid || reviewer?.email || null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(auditRef, {
      action: `verification_${status}`,
      status,
      message: auditMessage || `Verification marked ${status}`,
      reviewerUid: reviewer?.uid || null,
      reviewerEmail: reviewer?.email || null,
      createdAt: serverTimestamp(),
    });
  });
}
