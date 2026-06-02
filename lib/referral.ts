/**
 * lib/referral.ts
 * Pure Firestore referral logic — no backend APIs needed.
 *
 * Firestore schema:
 *   profiles/{uid}.referralCode  → "DRSH1A2B3C" (generated once, stored)
 *   profiles/{uid}.guardian_points → incremented on referral
 *   referrals/{autoId}           → { referrerId, refereeId, code, createdAt, pointsAwarded }
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

const POINTS_PER_REFERRAL = 50;

export function makeReferralCode(uid: string): string {
  return 'DRSH' + uid.substring(0, 6).toUpperCase();
}

export async function getOrCreateReferralCode(
  uid: string,
  db: Firestore
): Promise<string> {
  const profileRef = doc(db, 'profiles', uid);
  const snap = await getDoc(profileRef);
  if (snap.exists() && snap.data().referralCode) {
    return snap.data().referralCode as string;
  }
  const code = makeReferralCode(uid);
  await updateDoc(profileRef, { referralCode: code });
  return code;
}

export interface ReferralStats {
  totalInvites: number;
  completedInvites: number;
  pointsEarned: number;
}

export async function getReferralStats(
  uid: string,
  db: Firestore
): Promise<ReferralStats> {
  const q = query(collection(db, 'referrals'), where('referrerId', '==', uid));
  const snap = await getDocs(q);
  let pointsEarned = 0;
  snap.forEach((d) => { pointsEarned += (d.data().pointsAwarded || 0); });
  return { totalInvites: snap.size, completedInvites: snap.size, pointsEarned };
}

export async function claimReferral(
  referralCode: string,
  newUserId: string,
  db: Firestore
): Promise<void> {
  if (!referralCode || !newUserId) return;
  const dupQ = query(collection(db, 'referrals'), where('refereeId', '==', newUserId));
  const dupSnap = await getDocs(dupQ);
  if (!dupSnap.empty) return;
  const refQ = query(collection(db, 'profiles'), where('referralCode', '==', referralCode.toUpperCase()));
  const refSnap = await getDocs(refQ);
  if (refSnap.empty) return;
  const referrerId = refSnap.docs[0].id;
  if (referrerId === newUserId) return;
  const referralRef = doc(collection(db, 'referrals'));
  await setDoc(referralRef, {
    referrerId,
    refereeId: newUserId,
    code: referralCode.toUpperCase(),
    createdAt: serverTimestamp(),
    pointsAwarded: POINTS_PER_REFERRAL,
  });
  await updateDoc(doc(db, 'profiles', referrerId), {
    guardian_points: increment(POINTS_PER_REFERRAL),
  });
}
