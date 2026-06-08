const ALLOWED_DOMAINS = [
  "market.wildsaura.com",
  "drishya.wildsaura.com",
  "community.wildsaura.com",
  "creator.wildsaura.com",
  "identity.wildsaura.com",
  "wildsaura.com",
  // Additional app domains
  "lumina.wildsaura.com",
  "studio.wildsaura.com",
  // Development
  "localhost",
  "127.0.0.1",
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
