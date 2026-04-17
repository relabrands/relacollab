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

// Analytics — only initialize in environments that fully support it
export let analytics: ReturnType<typeof getAnalytics> | null = null;
analyticsIsSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

export const auth = getAuth(app);

// ---------------------------------------------------------
// Firestore transport fix for iOS Safari / WebKit browsers.
//
// Problem: Safari on iOS blocks the Firestore WebChannel
// transport (TYPE=xmlhttp) with:
//   "Fetch API cannot load ... due to access control checks"
// Safari's ITP treats firestore.googleapis.com as cross-site.
//
// Why AutoDetect didn't work: The SDK tries WebChannel first.
// On iOS Safari the block is completely silent — the SDK
// never detects it and the connection hangs indefinitely.
//
// Fix: experimentalForceLongPolling skips WebChannel entirely
// and goes directly to a single persistent HTTP/1.1 long-poll
// request. This pattern is NOT flagged by Safari's ITP.
//
// ignoreUndefinedProperties: prevents Firestore write errors
// when React state has undefined fields not yet initialized.
// ---------------------------------------------------------
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});

export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");
