// ====================================================================
// Identity.wildsaura — Firebase Client
// Provides getDb() / getAuth() / getStorage() interface
// compatible with the lumina auth model.
// Project: wildsaura-1ef8a
// ====================================================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth as fbGetAuth,
} from 'firebase/auth';
import { getStorage as fbGetStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCXDJrFmn-pzbqys91tj4Fruqn4tl58p9Y',
  authDomain: 'identity.wildsaura.com',
  databaseURL: 'https://wildsaura-1ef8a-default-rtdb.firebaseio.com',
  projectId: 'wildsaura-1ef8a',
  storageBucket: 'wildsaura-1ef8a.firebasestorage.app',
  messagingSenderId: '690017200836',
  appId: '1:690017200836:web:4c4cb0ec390be0f66ff791',
  measurementId: 'G-KSWRNGCLFP',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use indexedDB persistence for better iOS Safari compatibility
// Falls back to browserLocalPersistence if indexedDB is unavailable
let auth: ReturnType<typeof fbGetAuth>;
try {
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  // Already initialized
  auth = fbGetAuth(app);
}

const storage = fbGetStorage(app);

export function getDb() { return db; }
export function getAuth() { return auth; }
export function getStorage() { return storage; }
