/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Image Optimization ───────────────────────────────────────────────
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

  // ─── TypeScript & ESLint ──────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ─── External packages for server components ──────────────────────────
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
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ─── Rewrites ─────────────────────────────────────────────────────────
  // Firebase Google Sign-In on mobile uses redirect flow.
  // After Google auth, it redirects back to identity.wildsaura.com/__/auth/handler
  // We proxy this to Firebase so Next.js doesn't return 404.
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
