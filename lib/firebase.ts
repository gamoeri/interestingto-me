import { initializeApp,getApps } from "firebase/app"
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNSrC5gTkpnzKEC5n6i8BexlEjha631U0",
  authDomain: "interestingto.firebaseapp.com",
  projectId: "interestingto",
  storageBucket: "interestingto.firebasestorage.app",
  messagingSenderId: "750191746455",
  appId: "1:750191746455:web:bbbb3eeae89caab6d878d2",
  measurementId: "G-1R9F53C1RS"
}

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
// Initialize services
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }