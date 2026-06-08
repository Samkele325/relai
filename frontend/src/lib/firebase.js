// Import Firebase core
import { initializeApp } from "firebase/app";

// Import Firestore
import { getFirestore } from "firebase/firestore";

// Optional: Analytics
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDkxrjSrM0q7UhhuYQIdgA5_Q9IZ9EJiI",
  authDomain: "relai-b4487.firebaseapp.com",
  projectId: "relai-b4487",
  storageBucket: "relai-b4487.firebasestorage.app",
  messagingSenderId: "421893237159",
  appId: "1:421893237159:web:aea9a77ec4325ced14ee82",
  measurementId: "G-KSRDZKJPG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Optional analytics (browser only)
let analytics;

if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Export
export { app, db, analytics };