// lib/firebase-auth.js
// This creates a GLOBAL singleton for Firebase Auth to prevent multiple initializations

import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

// Create a single instance of auth that will be used throughout the app
// This prevents multiple auth listeners being set up
export const auth = getAuth(app);

// Force initialization to happen only once
let authInitialized = false;

// Export a function to get the auth instance that ensures it's only initialized once
export function getFirebaseAuth() {
  if (!authInitialized) {
    console.log('Firebase Auth singleton initialized');
    authInitialized = true;
  }
  return auth;
}