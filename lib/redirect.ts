// WildSaura app redirect utility
// After login, redirect users back to the originating WildSaura app

const ALLOWED_DOMAINS = [
  'wildsaura.com',
  'app.wildsaura.com',
  'dashboard.wildsaura.com',
];

export function getSafeRedirectUrl(param: string | null): string | null {
  if (!param) return null;
  try {
    const url = new URL(decodeURIComponent(param));
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
    return isAllowed ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildLoginUrl(redirectTo?: string): string {
  const base = '/login';
  if (!redirectTo) return base;
  return `${base}?redirect=${encodeURIComponent(redirectTo)}`;
}
