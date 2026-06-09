import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCXDJrFmn-pzbqys91tj4Fruqn4tl58p9Y",
  // Custom domain as authDomain — required for mobile Google redirect to work
  // Without this, Firebase redirects to /__/auth/handler on wildsaura-1ef8a.firebaseapp.com
  // which then can't find identity.wildsaura.com → 404
  authDomain: "identity.wildsaura.com",
  databaseURL: "https://wildsaura-1ef8a-default-rtdb.firebaseio.com",
  projectId: "wildsaura-1ef8a",
  storageBucket: "wildsaura-1ef8a.firebasestorage.app",
  messagingSenderId: "690017200836",
  appId: "1:690017200836:web:4c4cb0ec390be0f66ff791",
  measurementId: "G-KSWRNGCLFP",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Analytics is only supported in browser environments
const analyticsPromise = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);

export { auth, db, storage, analyticsPromise };
