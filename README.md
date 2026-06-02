# WildSaura Identity Service

One identity for all WildSaura apps.

## Tech Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Firebase Authentication**
- **Cloud Firestore**
- **Tailwind CSS**
- **Glassmorphism Dark Theme**

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=identity.wildsaura.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Deployment

Deploy on Vercel with custom domain `identity.wildsaura.com`

```bash
npm i -g vercel
vercel
vercel domain add identity.wildsaura.com
```

## Pages

| Route | Description |
|---|---|
| `/` | Home / Landing |
| `/login` | Login & Signup |
| `/dashboard` | User Dashboard |
| `/verify` | Email Verification |
| `/status` | Account Status |
| `/apps` | Connected Apps |
| `/security` | Security Settings |
