// Firebase Authentication and Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class FirebaseAuth {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.userId = null;
        this.docRef = null;
        this.unsubscribe = null;
        this.onAuthChangeCallback = null;
        this.onDataChangeCallback = null;
    }

    async initialize() {
        // Defensive check for firebase-config.js
        if (typeof window.userFirebaseConfig === 'undefined') {
            document.body.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="bg-white p-8 rounded shadow text-center"><h2 class="text-2xl font-bold mb-2 text-red-600">Configuration Error</h2><p>firebase-config.js is missing.</p></div></div>';
            throw new Error('FATAL: firebase-config.js not loaded!');
        }
        this.app = initializeApp(window.userFirebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, async (user) => {
            if (this.unsubscribe) this.unsubscribe();

            if (user) {
                this.userId = user.uid;
                this.docRef = doc(this.db, "users", this.userId);
                
                const userDoc = await getDoc(this.docRef);
                if (!userDoc.exists() && user.providerData[0]?.providerId === 'google.com') {
                    window.location.href = '/profile.html?onboarding=1';
                    return;
                }

                if (this.onAuthChangeCallback) this.onAuthChangeCallback({ user });
                this.setupDataListener();
            } else {
                // User is not authenticated
                this.userId = null;
                this.docRef = null;
                
                // Only redirect if not already on index page (login page)
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath === '/' || currentPath.includes('index.html') || currentPath === '/public/' || currentPath === '/public/index.html';
                
                if (!isOnLoginPage) {
                    window.location.href = '/';  // Changed from '/login.html' to '/'
                } else {
                    // On login page, call callback with null user
                    if (this.onAuthChangeCallback) this.onAuthChangeCallback({ user: null });
                }
            }
        });
    }

    setupDataListener() {
        if (!this.docRef) return;
        this.unsubscribe = onSnapshot(this.docRef, (snapshot) => {
            if (this.onDataChangeCallback) {
                this.onDataChangeCallback({ data: snapshot.data(), exists: snapshot.exists() });
            }
        }, (error) => {
            console.error("Snapshot listener error:", error);
        });
    }

    async saveData(data) {
        if (!this.docRef) return false;
        try {
            await setDoc(this.docRef, data, { merge: true });
            return true;
        } catch (error) {
            console.error("Error saving data to Firestore:", error);
            return false;
        }
    }

    onAuthChange(callback) { this.onAuthChangeCallback = callback; }
    onDataChange(callback) { this.onDataChangeCallback = callback; }
    getAuth() { return this.auth; }
    getUserId() { return this.userId; }
    
    async logout() {
        try {
            await signOut(this.auth);
            return true;
        } catch (error) {
            console.error("Error signing out:", error);
            return false;
        }
    }
}
