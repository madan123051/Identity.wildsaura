import type { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

export type VerificationStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export type ConnectedAppId = 'identity' | 'market' | 'drishya' | 'community' | 'creator';

export interface IdentityProfile {
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
  verificationStatus: VerificationStatus;
  verified: boolean;
  connectedApps: Record<string, any>;
  rawUser?: DocumentData;
  rawProfile?: DocumentData;
}

const STATUS_MAP: Record<string, VerificationStatus> = {
  not_started: 'not_started',
  pending: 'pending',
  verified: 'verified',
  rejected: 'rejected',
  approved: 'verified',
  none: 'not_started',
};

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

export function normalizeVerificationStatus(
  value: unknown,
  verified?: unknown
): VerificationStatus {
  if (typeof value === 'string') {
    const normalized = STATUS_MAP[value.toLowerCase().trim()];
    if (normalized) return normalized;
  }
  if (verified === true) return 'verified';
  return 'not_started';
}

export function isVerifiedFromStatus(status: VerificationStatus): boolean {
  return status === 'verified';
}

export function normalizeIdentityProfile(params: {
  uid: string;
  firebaseUser?: User | null;
  userData?: DocumentData | null;
  profileData?: DocumentData | null;
}): IdentityProfile {
  const { uid, firebaseUser, userData, profileData } = params;
  const status = normalizeVerificationStatus(
    userData?.verificationStatus ?? profileData?.verification_status,
    userData?.verified ?? profileData?.is_verified
  );

  return {
    uid,
    email: firstString(userData?.email, profileData?.email, firebaseUser?.email),
    displayName: firstString(
      userData?.displayName,
      profileData?.display_name,
      firebaseUser?.displayName,
      userData?.fullName,
      profileData?.fullName
    ),
    photoURL: firstString(userData?.photoURL, profileData?.avatar_url, firebaseUser?.photoURL),
    username: firstString(userData?.username, profileData?.username),
    phone: firstString(userData?.phone, profileData?.phone),
    address: firstString(userData?.address, profileData?.address),
    province: firstString(userData?.province, profileData?.province),
    country: firstString(userData?.country, profileData?.country, 'Nepal'),
    dateOfBirth: firstString(userData?.dateOfBirth, profileData?.date_of_birth),
    gender: firstString(userData?.gender, profileData?.gender),
    verificationStatus: status,
    verified: isVerifiedFromStatus(status),
    connectedApps: userData?.connectedApps || {},
    rawUser: userData || undefined,
    rawProfile: profileData || undefined,
  };
}

export function buildUserRecord(identity: IdentityProfile) {
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
    verificationStatus: identity.verificationStatus,
    verified: identity.verified,
    connectedApps: identity.connectedApps || {},
    updatedAt: serverTimestamp(),
  };
}

export function buildProfileRecord(identity: IdentityProfile) {
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
    verification_status: identity.verificationStatus,
    is_verified: identity.verified,
    updated_at: serverTimestamp(),
  };
}

export async function getIdentityProfile(
  db: Firestore,
  uid: string,
  firebaseUser?: User | null
): Promise<IdentityProfile> {
  const [userSnap, profileSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'profiles', uid)),
  ]);

  return normalizeIdentityProfile({
    uid,
    firebaseUser,
    userData: userSnap.exists() ? userSnap.data() : null,
    profileData: profileSnap.exists() ? profileSnap.data() : null,
  });
}

export async function ensureIdentityRecordsForAuthUser(
  db: Firestore,
  firebaseUser: User,
  extraProfile: Partial<IdentityProfile> = {}
): Promise<IdentityProfile> {
  const identity = await getIdentityProfile(db, firebaseUser.uid, firebaseUser);
  const merged: IdentityProfile = {
    ...identity,
    ...extraProfile,
    uid: firebaseUser.uid,
    email: firstString(extraProfile.email, identity.email, firebaseUser.email),
    displayName: firstString(extraProfile.displayName, identity.displayName, firebaseUser.displayName),
    photoURL: firstString(extraProfile.photoURL, identity.photoURL, firebaseUser.photoURL),
    verificationStatus: normalizeVerificationStatus(
      extraProfile.verificationStatus || identity.verificationStatus,
      extraProfile.verified ?? identity.verified
    ),
  };
  merged.verified = isVerifiedFromStatus(merged.verificationStatus);

  const userRef = doc(db, 'users', firebaseUser.uid);
  const profileRef = doc(db, 'profiles', firebaseUser.uid);
  const [userSnap, profileSnap] = await Promise.all([getDoc(userRef), getDoc(profileRef)]);

  const userRecord = buildUserRecord(merged);
  const profileRecord = buildProfileRecord(merged);

  await Promise.all([
    setDoc(userRef, {
      ...userRecord,
      createdAt: userSnap.exists() ? userSnap.data().createdAt || serverTimestamp() : serverTimestamp(),
    }, { merge: true }),
    setDoc(profileRef, {
      ...profileRecord,
      created_at: profileSnap.exists() ? profileSnap.data().created_at || serverTimestamp() : serverTimestamp(),
      terms_accepted: profileSnap.exists() ? profileSnap.data().terms_accepted ?? false : false,
    }, { merge: true }),
  ]);

  return merged;
}
