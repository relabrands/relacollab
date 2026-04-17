// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAdcqTsle-75xm6Y701uxAAp0ZP4PCIl2s",
  authDomain: "rella-collab.firebaseapp.com",
  projectId: "rella-collab",
  storageBucket: "rella-collab.firebasestorage.app",
  messagingSenderId: "86965001025",
  appId: "1:86965001025:web:9b834eab60970c75c31fc0",
  measurementId: "G-SEBPJ7W3VQ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Analytics — only initialize in environments that support it (not iOS WKWebView in strict mode)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
analyticsIsSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

export const auth = getAuth(app);

// Firestore — experimentalAutoDetectLongPolling resolves the Safari iOS/WebKit error:
//   "Fetch API cannot load ... due to access control checks"
// Safari blocks the default XMLHttpRequest long-poll transport for cross-origin domains.
// This flag makes the SDK detect the block and switch to a WebSocket channel instead.
// NOTE: persistentLocalCache is intentionally omitted — IndexedDB is restricted in
// Safari private browsing / low-storage mode and causes init failures.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

