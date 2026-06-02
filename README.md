# 🦁 WildSaura Identity Service

Central authentication and identity management system for all WildSaura apps.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/madan123051/Identity.wildsaura&env=NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID&envDescription=Firebase%20credentials%20from%20Firebase%20Console&project-name=wildsaura-identity&repository-name=wildsaura-identity)

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Auth & DB**: Firebase Auth + Firestore
- **Styling**: Tailwind CSS + Glassmorphism dark theme
- **Deploy**: Vercel (Region: Mumbai `bom1`)

---

## 📁 Project Structure

```
app/
├── page.tsx              # Root redirect
├── layout.tsx            # Root layout
├── login/page.tsx        # Login & Signup
├── dashboard/page.tsx    # User dashboard
├── verify/page.tsx       # Identity verification (4-step)
├── status/page.tsx       # Verification status
├── apps/page.tsx         # Connected WildSaura apps
└── security/page.tsx     # Password & security settings

components/
├── GlassCard.tsx         # Reusable glassmorphism card
├── Navbar.tsx            # Navigation with logout
└── ProtectedRoute.tsx    # Auth guard HOC

lib/
├── firebase.ts           # Firebase initialization
├── authContext.tsx        # useAuth hook + AuthProvider
└── redirect.ts           # Secure cross-app redirect logic
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🌐 Vercel Deployment

### Option 1 — One-click Deploy (Recommended)
Click the **Deploy with Vercel** button above ☝️

### Option 2 — Manual Deploy

1. **Import repo** at [vercel.com/new](https://vercel.com/new)
2. **Add Environment Variables** in Vercel Dashboard → Project → Settings → Environment Variables  
   _(All 6 `NEXT_PUBLIC_FIREBASE_*` keys required)_
3. **Deploy** → Done! 🎉

### Vercel Settings
| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Region | Mumbai (`bom1`) |

---

## 🗄️ Firestore Schema

```
users/{uid}
  - displayName: string
  - photoURL: string
  - verified: boolean
  - verificationStatus: "pending" | "approved" | "rejected" | "none"
  - connectedApps: string[]
  - createdAt: Timestamp
  - updatedAt: Timestamp

verifications/{uid}
  - uid: string
  - fullName: string
  - country: string
  - documentUrl: string
  - status: "pending" | "approved" | "rejected"
  - submittedAt: Timestamp
  - reviewedAt: Timestamp | null
```

---

## 🔗 Allowed Redirect Domains

```
market.wildsaura.com
drishya.wildsaura.com
community.wildsaura.com
identity.wildsaura.com
wildsaura.com
```

---

## 🔒 Security Features

- HTTP Security Headers (CSP, HSTS, X-Frame-Options)
- Protected routes with `ProtectedRoute` component
- Secure cross-app redirects (allowlist-based)
- Firebase Auth state persistence
- Environment variables never committed to git

---

*Built with ❤️ for the WildSaura ecosystem*
