# 🦁 WildSaura Identity Service

Central **authentication, identity & verification** hub for all WildSaura apps (4-site ecosystem).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/madan123051/Identity.wildsaura&env=NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID&envDescription=Firebase%20credentials%20from%20Firebase%20Console&project-name=wildsaura-identity&repository-name=wildsaura-identity)

---

## 🔑 Admin Access

| Field | Value |
|-------|-------|
| **Admin Email** | `madan123050@gmail.com` |
| **Admin Dashboard** | `/admin` |
| **Auth Guard** | `lib/authContext.tsx` → `ADMIN_EMAIL` constant |

Only the admin email can access the `/admin` verification dashboard.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Auth & DB**: Firebase Auth + Firestore (Project: `wildsaura-1ef8a`)
- **Styling**: Tailwind CSS + Glassmorphism dark theme
- **Deploy**: Vercel (Region: Mumbai `bom1`)

---

## 📁 Project Structure

```
app/
├── page.tsx                    # Root landing page
├── layout.tsx                  # Root layout (AuthProvider)
├── login/page.tsx              # Login & Signup entry
├── dashboard/page.tsx          # User dashboard
├── verify/page.tsx             # Identity verification (4-step KYC)
├── status/page.tsx             # Verification status page
├── apps/page.tsx               # Connected WildSaura apps
├── security/page.tsx           # Password & security settings
└── admin/page.tsx              # 🛡️ Admin verification dashboard

components/
├── GlassCard.tsx               # Glassmorphism card component
├── Navbar.tsx                  # Navigation with logout
├── ProtectedRoute.tsx          # Auth guards (ProtectedRoute + AdminRoute)
└── auth/
    ├── index.tsx               # Auth page root component
    ├── AuthContext.ts          # Auth context interface & hook
    ├── AuthTypes.ts            # TypeScript types
    ├── AuthLogo.tsx            # Logo component
    ├── LoginView.tsx           # Login form UI
    ├── SignupFormView.tsx       # Signup form UI (multi-step)
    ├── TermsView.tsx           # Terms & conditions view
    ├── ForgotPasswordView.tsx  # Forgot password UI
    ├── ResetSentView.tsx       # Reset email sent confirmation
    ├── CreatingAccountView.tsx # Account creation loading screen
    ├── authConstants.ts        # Terms content + Nepal provinces
    ├── authUtils.ts            # Validation helpers
    └── hooks/
        └── useAuth.ts          # Main auth hook (login, signup, Google)

lib/
├── firebase.ts                 # Firebase initialization (shared)
├── firebaseClient.ts           # Firebase client (getDb/getAuth/getStorage)
├── authContext.tsx             # useAuth hook + AuthProvider + ADMIN_EMAIL
├── referral.ts                 # Referral code logic
└── redirect.ts                 # Secure cross-app redirect (allowlist)
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` (values already filled in for the WildSaura Firebase project):

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
npm install
npm run dev
```

---

## 🌐 Vercel Deployment

1. **Import repo** at [vercel.com/new](https://vercel.com/new)
2. **Add Environment Variables** from `.env.example`
3. **Deploy** → Done! 🎉

### Vercel Settings
| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Region | Mumbai (`bom1`) |

---

## 🗄️ Firestore Schema

```
users/{uid}
  - displayName: string
  - photoURL: string
  - verified: boolean
  - verificationStatus: "pending" | "verified" | "rejected" | "none"
  - connectedApps: string[]
  - createdAt: Timestamp
  - updatedAt: Timestamp

verifications/{uid}
  - uid: string
  - fullName: string
  - country: string
  - documentUrl: string
  - status: "pending" | "verified" | "rejected"
  - submittedAt: Timestamp
  - reviewedAt: Timestamp | null

profiles/{uid}
  - username: string
  - display_name: string
  - email: string
  - phone: string
  - province: string
  - date_of_birth: string
  - gender: string
  - terms_accepted: boolean
  - verification_status: string
  - is_verified: boolean
```

---

## 🔗 Allowed Redirect Domains (4-site Ecosystem)

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
- Protected routes with `ProtectedRoute` + `AdminRoute` components
- Admin-only dashboard guarded by email check
- Secure cross-app redirects (allowlist-based)
- Firebase Auth state persistence
- Age validation (16+ required for signup)

---

*Built with ❤️ for the WildSaura 4-site ecosystem*
