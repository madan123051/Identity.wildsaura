import {
  Firestore,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { normalizeVerificationStatus, statusToVerified, VerificationStatus } from './identity';

type Reviewer = {
  uid?: string;
  email?: string | null;
};

export async function submitVerificationRequest(
  db: Firestore,
  uid: string,
  data: {
    fullName: string;
    country: string;
    /** Primary document URL — typically the front photo */
    documentUrl?: string;
    /** Front photo URL (from direct upload) */
    documentFrontUrl?: string;
    /** Back photo URL (from direct upload) */
    documentBackUrl?: string;
    email?: string | null;
    documentType?: string;
    documentNumber?: string;
    phone?: string;
    notes?: string;
  }
) {
  // Resolve the canonical documentUrl: prefer documentFrontUrl if provided
  const resolvedDocumentUrl = data.documentFrontUrl || data.documentUrl || '';

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', uid);
    const profileRef = doc(db, 'profiles', uid);
    const verificationRef = doc(db, 'verifications', uid);
    const now = serverTimestamp();

    transaction.set(userRef, {
      uid,
      email: data.email || '',
      displayName: data.fullName,
      fullName: data.fullName,
      country: data.country,
      phone: data.phone || '',
      documentUrl: resolvedDocumentUrl,
      documentFrontUrl: data.documentFrontUrl || '',
      documentBackUrl: data.documentBackUrl || '',
      documentType: data.documentType || '',
      documentNumber: data.documentNumber || '',
      verificationStatus: 'pending',
      verified: false,
      isVerified: false,
      submittedAt: now,
      updatedAt: now,
    }, { merge: true });

    transaction.set(profileRef, {
      id: uid,
      email: data.email || '',
      display_name: data.fullName,
      country: data.country,
      phone: data.phone || '',
      id_proof_url: resolvedDocumentUrl,
      id_document_front_url: data.documentFrontUrl || '',
      id_document_back_url: data.documentBackUrl || '',
      id_document_type: data.documentType || '',
      id_document_number: data.documentNumber || '',
      verification_status: 'pending',
      is_verified: false,
      verification_badge: 'none',
      updated_at: now,
    }, { merge: true });

    transaction.set(verificationRef, {
      uid,
      fullName: data.fullName,
      country: data.country,
      phone: data.phone || '',
      documentUrl: resolvedDocumentUrl,
      documentFrontUrl: data.documentFrontUrl || '',
      documentBackUrl: data.documentBackUrl || '',
      documentType: data.documentType || '',
      documentNumber: data.documentNumber || '',
      notes: data.notes || '',
      status: 'pending',
      submittedAt: now,
      reviewedAt: null,
      updatedAt: now,
    }, { merge: true });
  });
}

export async function syncVerificationStatus(
  db: Firestore,
  uid: string,
  rawStatus: VerificationStatus | string,
  reviewer: Reviewer = {}
) {
  const status = normalizeVerificationStatus(rawStatus);
  const verified = statusToVerified(status);

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', uid);
    const profileRef = doc(db, 'profiles', uid);
    const verificationRef = doc(db, 'verifications', uid);
    const auditRef = doc(db, 'verifications', uid, 'auditLogs', `${Date.now()}-${reviewer.uid || 'reviewer'}`);
    const now = serverTimestamp();

    transaction.set(userRef, {
      verificationStatus: status,
      verified,
      // Also write `isVerified` so apps that read this field (e.g. wildsaura-market)
      // pick up the correct state without needing a field-name migration.
      isVerified: verified,
      reviewedAt: status === 'verified' || status === 'rejected' ? now : null,
      reviewedBy: reviewer.uid || reviewer.email || null,
      updatedAt: now,
    }, { merge: true });

    transaction.set(profileRef, {
      verification_status: status,
      is_verified: verified,
      verified_at: verified ? now : null,
      verification_badge: verified ? 'verified' : 'none',
      updated_at: now,
    }, { merge: true });

    transaction.set(verificationRef, {
      uid,
      status,
      reviewedAt: status === 'verified' || status === 'rejected' ? now : null,
      reviewedBy: reviewer.uid || reviewer.email || null,
      updatedAt: now,
    }, { merge: true });

    transaction.set(auditRef, {
      uid,
      action: 'verification_status_updated',
      status,
      reviewedBy: reviewer.uid || null,
      reviewerEmail: reviewer.email || null,
      createdAt: now,
    });
  });
}

export async function markVerificationNotStarted(db: Firestore, uid: string) {
  await setDoc(doc(db, 'users', uid), {
    verificationStatus: 'not_started',
    verified: false,
    isVerified: false,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
