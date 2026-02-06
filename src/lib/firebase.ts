// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
