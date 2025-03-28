// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNSrC5gTkpnzKEC5n6i8BexlEjha631U0",
  authDomain: "interestingto.firebaseapp.com",
  projectId: "interestingto",
  storageBucket: "interestingto.firebasestorage.app",
  messagingSenderId: "750191746455",
  appId: "1:750191746455:web:bbbb3eeae89caab6d878d2",
  measurementId: "G-1R9F53C1RS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
