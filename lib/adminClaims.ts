import { User } from 'firebase/auth';

export type IdentityClaims = {
  admin: boolean;
  verificationReviewer: boolean;
};

export async function getIdentityClaims(user: User | null): Promise<IdentityClaims> {
  if (!user) return { admin: false, verificationReviewer: false };
  const token = await user.getIdTokenResult(true);
  return {
    admin: token.claims.admin === true,
    verificationReviewer: token.claims.verificationReviewer === true,
  };
}

export function canReviewVerification(claims: IdentityClaims): boolean {
  return claims.admin || claims.verificationReviewer;
}
