import { User } from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

export type VerificationStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export type ConnectedAppId = 'identity' | 'market' | 'drishya' | 'community' | 'creator';

export type ConnectedAppState = {
  connected: boolean;
  firstSeen?: Timestamp | Date | string | null;
  lastSeen?: Timestamp | Date | string | null;
};

export type IdentityProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  username: string;
  phone: string;
  address: string;
  province: string;
  country: string;
  dateOfBirth: string;
  gender: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  documentUrl: string;
  connectedApps: Partial<Record<ConnectedAppId, boolean | ConnectedAppState>>;
  termsAccepted: boolean;
  createdAt?: any;
  updatedAt?: any;
  submittedAt?: any;
  reviewedAt?: any;
  source: 'users' | 'profiles' | 'auth' | 'merged';
};

const CANONICAL_STATUSES: VerificationStatus[] = [
  'not_started',
  'pending',
  'verified',
  'rejected',
];

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function firstBoolean(...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return false;
}

export function normalizeVerificationStatus(
  status?: unknown,
  verified?: unknown
): VerificationStatus {
  if (verified === true) return 'verified';
  if (typeof status !== 'string' || !status.trim()) return 'not_started';

  const normalized = status.trim().toLowerCase();
  if (normalized === 'approved') return 'verified';
  if (normalized === 'none' || normalized === 'null') return 'not_started';
  if (CANONICAL_STATUSES.includes(normalized as VerificationStatus)) {
    return normalized as VerificationStatus;
  }
  return 'not_started';
}

export function statusToVerified(status: VerificationStatus): boolean {
  return status === 'verified';
}

export function normalizeConnectedApps(
  value: unknown
): Partial<Record<ConnectedAppId, boolean | ConnectedAppState>> {
  if (!value || typeof value !== 'object') return {};
  return value as Partial<Record<ConnectedAppId, boolean | ConnectedAppState>>;
}

export function isAppConnected(
  connectedApps: IdentityProfile['connectedApps'],
  appId: ConnectedAppId
): boolean {
  const entry = connectedApps?.[appId];
  if (typeof entry === 'boolean') return entry;
  if (entry && typeof entry === 'object') return entry.connected === true;
  return false;
}

export function formatFirebaseDate(value: any): string {
  const date = value?.toDate?.() instanceof Date ? value.toDate() : value instanceof Date ? value : null;
  return date ? date.toLocaleString() : '—';
}

export function mergeIdentityProfile({
  uid,
  authUser,
  userData,
  profileData,
  verificationData,
}: {
  uid: string;
  authUser?: User | null;
  userData?: any;
  profileData?: any;
  verificationData?: any;
}): IdentityProfile {
  const verificationStatus = normalizeVerificationStatus(
    userData?.verificationStatus ?? profileData?.verification_status ?? verificationData?.status,
    userData?.verified ?? profileData?.is_verified
  );

  const source = userData && profileData ? 'merged' : userData ? 'users' : profileData ? 'profiles' : 'auth';

  return {
    uid,
    email: firstString(userData?.email, profileData?.email, authUser?.email),
    displayName: firstString(userData?.displayName, userData?.fullName, profileData?.display_name, authUser?.displayName, authUser?.email),
    photoURL: firstString(userData?.photoURL, profileData?.avatar_url, authUser?.photoURL),
    username: firstString(userData?.username, profileData?.username),
    phone: firstString(userData?.phone, profileData?.phone),
    address: firstString(userData?.address, profileData?.address),
    province: firstString(userData?.province, profileData?.province),
    country: firstString(userData?.country, profileData?.country, verificationData?.country),
    dateOfBirth: firstString(userData?.dateOfBirth, profileData?.date_of_birth),
    gender: firstString(userData?.gender, profileData?.gender),
    verified: firstBoolean(userData?.verified, profileData?.is_verified) || verificationStatus === 'verified',
    verificationStatus,
    documentUrl: firstString(userData?.documentUrl, userData?.documentURL, verificationData?.documentUrl, verificationData?.documentURL, profileData?.id_proof_url),
    connectedApps: normalizeConnectedApps(userData?.connectedApps),
    termsAccepted: firstBoolean(userData?.termsAccepted, profileData?.terms_accepted),
    createdAt: userData?.createdAt ?? profileData?.created_at,
    updatedAt: userData?.updatedAt ?? profileData?.updated_at,
    submittedAt: userData?.submittedAt ?? verificationData?.submittedAt,
    reviewedAt: userData?.reviewedAt ?? verificationData?.reviewedAt ?? profileData?.verified_at,
    source,
  };
}

export function buildUserRecordFromIdentity(identity: IdentityProfile) {
  return {
    uid: identity.uid,
    email: identity.email,
    displayName: identity.displayName,
    photoURL: identity.photoURL,
    username: identity.username,
    phone: identity.phone,
    address: identity.address,
    province: identity.province,
    country: identity.country,
    dateOfBirth: identity.dateOfBirth,
    gender: identity.gender,
    verified: statusToVerified(identity.verificationStatus),
    verificationStatus: identity.verificationStatus,
    connectedApps: identity.connectedApps || {},
    termsAccepted: identity.termsAccepted,
    updatedAt: serverTimestamp(),
  };
}

export function buildProfileRecordFromIdentity(identity: IdentityProfile) {
  return {
    id: identity.uid,
    email: identity.email,
    display_name: identity.displayName,
    avatar_url: identity.photoURL,
    username: identity.username,
    phone: identity.phone,
    address: identity.address,
    province: identity.province,
    country: identity.country || 'Nepal',
    date_of_birth: identity.dateOfBirth,
    gender: identity.gender,
    is_verified: statusToVerified(identity.verificationStatus),
    verification_status: identity.verificationStatus,
    terms_accepted: identity.termsAccepted,
    updated_at: serverTimestamp(),
  };
}

export async function getIdentityProfile(
  db: Firestore,
  uid: string,
  authUser?: User | null
): Promise<IdentityProfile> {
  const [userSnap, profileSnap, verificationSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'profiles', uid)),
    getDoc(doc(db, 'verifications', uid)),
  ]);

  return mergeIdentityProfile({
    uid,
    authUser,
    userData: userSnap.exists() ? userSnap.data() : undefined,
    profileData: profileSnap.exists() ? profileSnap.data() : undefined,
    verificationData: verificationSnap.exists() ? verificationSnap.data() : undefined,
  });
}

export async function ensureIdentityRecordsForAuthUser(
  db: Firestore,
  authUser: User,
  extraProfile: Partial<IdentityProfile> = {}
): Promise<IdentityProfile> {
  const identity = await getIdentityProfile(db, authUser.uid, authUser);
  const merged: IdentityProfile = {
    ...identity,
    ...extraProfile,
    uid: authUser.uid,
    email: firstString(extraProfile.email, identity.email, authUser.email),
    displayName: firstString(extraProfile.displayName, identity.displayName, authUser.displayName, authUser.email),
    photoURL: firstString(extraProfile.photoURL, identity.photoURL, authUser.photoURL),
    verificationStatus: normalizeVerificationStatus(extraProfile.verificationStatus ?? identity.verificationStatus, extraProfile.verified ?? identity.verified),
  };

  const [userSnap, profileSnap] = await Promise.all([
    getDoc(doc(db, 'users', authUser.uid)),
    getDoc(doc(db, 'profiles', authUser.uid)),
  ]);

  if (!userSnap.exists()) {
    await setDoc(doc(db, 'users', authUser.uid), {
      ...buildUserRecordFromIdentity(merged),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } else {
    await setDoc(doc(db, 'users', authUser.uid), buildUserRecordFromIdentity(merged), { merge: true });
  }

  if (!profileSnap.exists()) {
    await setDoc(doc(db, 'profiles', authUser.uid), {
      ...buildProfileRecordFromIdentity(merged),
      role: 'user',
      guardian_points: 0,
      guardian_level: 'explorer',
      verification_badge: merged.verified ? 'verified' : 'none',
      id_proof_url: merged.documentUrl || null,
      created_at: serverTimestamp(),
    }, { merge: true });
  } else {
    await setDoc(doc(db, 'profiles', authUser.uid), buildProfileRecordFromIdentity(merged), { merge: true });
  }

  return merged;
}
