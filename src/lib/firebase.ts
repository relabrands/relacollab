// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
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

// Analytics — only supported in full browser environments (not iOS WKWebView, etc.)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
analyticsIsSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

export const auth = getAuth(app);

// Firestore — experimentalAutoDetectLongPolling fixes Safari iOS CORS errors.
// Safari WebKit blocks the default fetch-based long-poll transport; this flag
// causes the SDK to auto-detect and fall back to a WebSocket transport instead.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");
