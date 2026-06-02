import type { User } from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { normalizeConnectedApps } from "./connectedApps";
import { normalizeVerificationStatus, type VerificationStatus } from "./verification";

export type IdentityProfile = {
  uid: string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  country?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  verificationStatus: VerificationStatus;
  verified: boolean;
  connectedApps: ReturnType<typeof normalizeConnectedApps>;
  documentUrl?: string | null;
  submittedAt?: any;
  reviewedAt?: any;
  createdAt?: any;
  updatedAt?: any;
  source: "users" | "profiles" | "auth";
};

const firstValue = <T,>(...values: T[]): T | undefined =>
  values.find((value) => value !== undefined && value !== null && value !== "");

function makeUsername(user: User) {
  const base = (user.email?.split("@")[0] || user.displayName || `user_${user.uid.slice(0, 8)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  return base.length >= 3 ? base : `user_${user.uid.slice(0, 8)}`;
}

export function normalizeIdentityProfile(args: {
  uid: string;
  userData?: any;
  profileData?: any;
  verificationData?: any;
  authUser?: User | null;
}): IdentityProfile {
  const { uid, userData = {}, profileData = {}, verificationData = {}, authUser } = args;
  const verificationStatus = normalizeVerificationStatus(
    firstValue(
      userData.verificationStatus,
      profileData.verification_status,
      verificationData.status
    ),
    firstValue(userData.verified, profileData.is_verified)
  );

  return {
    uid,
    email: firstValue(userData.email, profileData.email, authUser?.email, null),
    username: firstValue(userData.username, profileData.username, null),
    displayName: firstValue(
      userData.displayName,
      userData.fullName,
      profileData.display_name,
      profileData.displayName,
      verificationData.fullName,
      authUser?.displayName,
      authUser?.email,
      null
    ),
    photoURL: firstValue(userData.photoURL, profileData.avatar_url, authUser?.photoURL, null),
    phone: firstValue(userData.phone, profileData.phone, null),
    address: firstValue(userData.address, profileData.address, null),
    province: firstValue(userData.province, profileData.province, null),
    country: firstValue(userData.country, profileData.country, verificationData.country, null),
    dateOfBirth: firstValue(userData.dateOfBirth, profileData.date_of_birth, null),
    gender: firstValue(userData.gender, profileData.gender, null),
    verificationStatus,
    verified: verificationStatus === "verified",
    connectedApps: normalizeConnectedApps(userData.connectedApps),
    documentUrl: firstValue(
      verificationData.documentUrl,
      verificationData.documentURL,
      userData.documentUrl,
      userData.documentURL,
      profileData.id_proof_url,
      null
    ),
    submittedAt: firstValue(verificationData.submittedAt, userData.submittedAt, null),
    reviewedAt: firstValue(verificationData.reviewedAt, userData.reviewedAt, profileData.verified_at, null),
    createdAt: firstValue(userData.createdAt, profileData.created_at, authUser?.metadata?.creationTime, null),
    updatedAt: firstValue(userData.updatedAt, profileData.updated_at, null),
    source: userData.uid || Object.keys(userData).length ? "users" : Object.keys(profileData).length ? "profiles" : "auth",
  };
}

export async function getIdentityProfile(db: Firestore, authUser: User): Promise<IdentityProfile> {
  const [userSnap, profileSnap, verificationSnap] = await Promise.all([
    getDoc(doc(db, "users", authUser.uid)),
    getDoc(doc(db, "profiles", authUser.uid)),
    getDoc(doc(db, "verifications", authUser.uid)),
  ]);

  return normalizeIdentityProfile({
    uid: authUser.uid,
    userData: userSnap.exists() ? userSnap.data() : undefined,
    profileData: profileSnap.exists() ? profileSnap.data() : undefined,
    verificationData: verificationSnap.exists() ? verificationSnap.data() : undefined,
    authUser,
  });
}

export async function ensureIdentityRecordsForAuthUser(db: Firestore, user: User) {
  const userRef = doc(db, "users", user.uid);
  const profileRef = doc(db, "profiles", user.uid);
  const [userSnap, profileSnap, verificationSnap] = await Promise.all([
    getDoc(userRef),
    getDoc(profileRef),
    getDoc(doc(db, "verifications", user.uid)),
  ]);
  const userData = userSnap.exists() ? userSnap.data() : {};
  const profileData = profileSnap.exists() ? profileSnap.data() : {};
  const verificationData = verificationSnap.exists() ? verificationSnap.data() : {};
  const identity = normalizeIdentityProfile({ uid: user.uid, userData, profileData, verificationData, authUser: user });
  const now = serverTimestamp();

  if (!profileSnap.exists()) {
    await setDoc(
      profileRef,
      {
        id: user.uid,
        username: identity.username || makeUsername(user),
        display_name: identity.displayName || user.email || "WildSaura User",
        avatar_url: identity.photoURL || "",
        email: identity.email || user.email || "",
        role: "user",
        country: identity.country || "Nepal",
        verification_status: identity.verificationStatus,
        is_verified: identity.verified,
        verification_badge: identity.verified ? "identity" : "none",
        terms_accepted: profileData.terms_accepted ?? false,
        guardian_points: profileData.guardian_points || 0,
        guardian_level: profileData.guardian_level || "explorer",
        created_at: now,
        updated_at: now,
      },
      { merge: true }
    );
  }

  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: identity.email || user.email || "",
      username: identity.username || profileData.username || makeUsername(user),
      displayName: identity.displayName || user.displayName || user.email || "WildSaura User",
      photoURL: identity.photoURL || user.photoURL || "",
      phone: identity.phone || profileData.phone || null,
      address: identity.address || profileData.address || null,
      province: identity.province || profileData.province || null,
      country: identity.country || profileData.country || "Nepal",
      dateOfBirth: identity.dateOfBirth || profileData.date_of_birth || null,
      gender: identity.gender || profileData.gender || null,
      verificationStatus: identity.verificationStatus,
      verified: identity.verified,
      connectedApps: {
        ...identity.connectedApps,
        identity: {
          connected: true,
          firstSeen: identity.connectedApps.identity.firstSeen || now,
          lastSeen: now,
        },
      },
      createdAt: userData.createdAt || now,
      updatedAt: now,
    },
    { merge: true }
  );

  return identity;
}
