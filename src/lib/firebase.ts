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

// 일부 모바일/PWA 환경에서는 persistentLocalCache 초기화가 실패할 수 있으므로
// 실패 시 일반 Firestore 인스턴스로 폴백한다.
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });
  } catch (error) {
    console.warn("Firestore local cache unavailable, falling back:", error);
    return getFirestore(app);
  }
})();
