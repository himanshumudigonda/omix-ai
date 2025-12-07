import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyCm4g8rXxlLBu3SsYfWOOVZ6gTepOBO5bg",
    authDomain: "omix-ai.firebaseapp.com",
    projectId: "omix-ai",
    storageBucket: "omix-ai.firebasestorage.app",
    messagingSenderId: "9525033428",
    appId: "1:9525033428:web:7dc7abffe31a8b5dad7e41",
    measurementId: "G-ETHZJM0NN5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (optional, only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
