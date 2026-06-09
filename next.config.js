/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Image Optimization ──────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // ─── TypeScript & ESLint ───────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ─── External packages for server components (Next.js 14.2 syntax) ────
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },

  // ─── Security Headers ─────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.firebaseio.com",
              // Added identity.wildsaura.com for Firebase custom authDomain redirect support
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://identity.wildsaura.com",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ─── Rewrites — proxy Firebase auth handler paths ─────────────────────
  // Firebase Google Sign-In redirect (mobile fallback) redirects to:
  //   identity.wildsaura.com/__/auth/handler
  // Next.js doesn't know this route → 404. We proxy it to Firebase here.
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://wildsaura-1ef8a.firebaseapp.com/__/auth/:path*',
      },
      {
        source: '/__/firebase/:path*',
        destination: 'https://wildsaura-1ef8a.firebaseapp.com/__/firebase/:path*',
      },
      // Existing redirect kept as rewrite for compatibility
      {
        source: '/home',
        destination: '/dashboard',
      },
    ];
  },

  // ─── Redirects ────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // ─── Production optimizations ─────────────────────────────────────────
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;
