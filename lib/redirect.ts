const ALLOWED_DOMAINS = [
  "market.wildsaura.com",
  "drishya.wildsaura.com",
  "community.wildsaura.com",
  "creator.wildsaura.com",
  "identity.wildsaura.com",
  "wildsaura.com",
];

export function validateReturnUrl(url: string): string {
  try {
    const u = new URL(url);
    if (ALLOWED_DOMAINS.includes(u.hostname)) {
      return url;
    }
  } catch {}
  return "/dashboard";
}