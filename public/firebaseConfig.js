// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    OAuthProvider, 
    signInWithPopup, 
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration is loaded from window
const firebaseConfig = window.userFirebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export everything for other modules to use
export { 
    app, 
    auth, 
    db, 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    OAuthProvider, 
    signInWithPopup, 
    signInAnonymously,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
};