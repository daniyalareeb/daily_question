// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDp1uTI-BhRtGMIOCW5qKr04JpHrAaIOnE",
  authDomain: "dailyquestion-fcbae.firebaseapp.com",
  projectId: "dailyquestion-fcbae",
  storageBucket: "dailyquestion-fcbae.appspot.com",
  messagingSenderId: "668300380437",
  appId: "1:668300380437:web:dailyquestion-fcbae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
