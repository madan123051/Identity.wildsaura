import { User } from 'firebase/auth';

const IDENTITY_ADMIN_EMAILS = ['madan123050@gmail.com'];

export type IdentityClaims = {
  admin: boolean;
  verificationReviewer: boolean;
};

function isIdentityAdminEmail(email?: string | null): boolean {
  return Boolean(email && IDENTITY_ADMIN_EMAILS.includes(email.trim().toLowerCase()));
}

export async function getIdentityClaims(user: User | null): Promise<IdentityClaims> {
  if (!user) return { admin: false, verificationReviewer: false };

  const isEmailAdmin = isIdentityAdminEmail(user.email);
  const token = await user.getIdTokenResult(true);

  return {
    admin: isEmailAdmin || token.claims.admin === true,
    verificationReviewer: isEmailAdmin || token.claims.verificationReviewer === true,
  };
}

export function canReviewVerification(claims: IdentityClaims): boolean {
  return claims.admin || claims.verificationReviewer;
}
