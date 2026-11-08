import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyD1utosh7SoMcp8emH1KtjSN9qVcOVP4sE",
  authDomain: "keeish.firebaseapp.com",
  databaseURL: "https://keeish-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "keeish",
  storageBucket: "keeish.firebasestorage.app",
  messagingSenderId: "757713727711",
  appId: "1:757713727711:web:e41b3c86d350a49cdd396a",
  measurementId: "G-SS35BP7JK9"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getDatabase(app);
export const BASE = 'keeishChat';

// Set persistence (try session persistence first, fallback to local)
setPersistence(auth, browserSessionPersistence).catch(() => {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Persistence error:', err);
  });
});
