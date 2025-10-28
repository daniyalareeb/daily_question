// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "dailyquestion-fcbae.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "dailyquestion-fcbae",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "dailyquestion-fcbae.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "668300380437",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:668300380437:web:dailyquestion-fcbae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
