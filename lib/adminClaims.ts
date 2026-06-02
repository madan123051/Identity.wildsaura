import type { User } from 'firebase/auth';

export interface IdentityClaims {
  admin: boolean;
  verificationReviewer: boolean;
}

export async function getIdentityClaims(user: User | null): Promise<IdentityClaims> {
  if (!user) return { admin: false, verificationReviewer: false };
  const token = await user.getIdTokenResult();
  return {
    admin: token.claims.admin === true,
    verificationReviewer: token.claims.verificationReviewer === true,
  };
}

export function canReviewVerification(claims: IdentityClaims): boolean {
  return claims.admin || claims.verificationReviewer;
}
