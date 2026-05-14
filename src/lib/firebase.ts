import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Firestore with offline persistence — falls back to in-memory cache on
// environments that don't support IndexedDB (some iOS WebViews, private mode).
export const db = (() => {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache() });
  } catch {
    console.warn("Firestore persistentLocalCache unavailable; using default cache.");
    return getFirestore(app);
  }
})();
