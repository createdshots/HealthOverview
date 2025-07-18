// Firebase Authentication and Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
        if (typeof userFirebaseConfig === 'undefined') {
            document.body.innerHTML = '<div class="flex items-center justify-center min-h-screen"><div class="bg-white p-8 rounded shadow text-center"><h2 class="text-2xl font-bold mb-2 text-red-600">Configuration Error</h2><p class="text-gray-700 mb-4">firebase-config.js is missing or not loaded.<br>Please contact the site owner or try again later.</p></div></div>';
            throw new Error('FATAL: firebase-config.js not loaded!');
        }

        try {
            console.log("Initializing Firebase with config:", userFirebaseConfig);
            this.app = initializeApp(userFirebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            console.log("Firebase initialized successfully");
            
            this.setupAuthListener();
            return { app: this.app, auth: this.auth, db: this.db };
        } catch (e) {
            console.error("Firebase initialization failed:", e);
            throw e;
        }
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, async (user) => {
            // Clean up any existing listener
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }

            if (user) {
                this.userId = user.uid;
                this.docRef = doc(this.db, "users", this.userId);
                
                // Check if this is a new Google SSO user
                const isGoogleSSO = user.providerData && user.providerData.some(p => p.providerId && p.providerId.includes('google.com'));
                if (isGoogleSSO) {
                    try {
                        const userDocSnap = await getDoc(this.docRef);
                        if (!userDocSnap.exists()) {
                            // New user, redirect to onboarding
                            window.location.href = '/profile.html?onboarding=1';
                            return;
                        }
                    } catch (err) {
                        console.error('Error checking user doc existence:', err);
                        if (this.onAuthChangeCallback) {
                            this.onAuthChangeCallback({ error: 'Error checking user profile.', user: null });
                        }
                        return;
                    }
                }

                // Call auth change callback
                if (this.onAuthChangeCallback) {
                    this.onAuthChangeCallback({ user, userId: this.userId });
                }

                this.setupDataListener();
            } else {
                // User signed out, redirect to login
                window.location.href = '/login.html';
            }
        });
    }

    setupDataListener() {
        if (!this.docRef) {
            console.log("No docRef available for snapshot listener");
            return;
        }

        console.log("Setting up snapshot listener for:", this.docRef.path);

        this.unsubscribe = onSnapshot(this.docRef, async (snapshot) => {
            try {
                if (snapshot.exists()) {
                    const firestoreData = snapshot.data();
                    if (this.onDataChangeCallback) {
                        this.onDataChangeCallback({ data: firestoreData, exists: true });
                    }
                } else {
                    // Document doesn't exist, signal to initialize default data
                    if (this.onDataChangeCallback) {
                        this.onDataChangeCallback({ data: null, exists: false });
                    }
                }
            } catch (error) {
                console.error("Error processing snapshot:", error);
                if (this.onDataChangeCallback) {
                    this.onDataChangeCallback({ error: "Error loading data." });
                }
            }
        }, (error) => {
            console.error("Snapshot listener error:", error);
            if (this.onDataChangeCallback) {
                this.onDataChangeCallback({ error: "Error connecting to database." });
            }
        });
    }

    async saveData(data) {
        if (!this.docRef || !this.userId) {
            console.log("No document reference or user ID available, skipping save");
            return false;
        }

        try {
            console.log("Attempting to save data to Firestore...", {
                userId: this.userId,
                docPath: this.docRef.path,
                dataKeys: Object.keys(data)
            });

            await setDoc(this.docRef, data, { merge: true });
            console.log("Data saved successfully to Firestore");
            return true;
        } catch (error) {
            console.error("Error saving data to Firestore:", error);
            return false;
        }
    }

    async getCurrentUserDoc() {
        if (!this.docRef) return null;
        try {
            const userDocSnap = await getDoc(this.docRef);
            return userDocSnap.exists() ? userDocSnap.data() : null;
        } catch (error) {
            console.error("Error getting user document:", error);
            return null;
        }
    }

    onAuthChange(callback) {
        this.onAuthChangeCallback = callback;
    }

    onDataChange(callback) {
        this.onDataChangeCallback = callback;
    }

    getUserId() {
        return this.userId;
    }

    getAuth() {
        return this.auth;
    }

    getDb() {
        return this.db;
    }

    async signOut() {
        try {
            await signOut(this.auth);
            return true;
        } catch (error) {
            console.error("Error signing out:", error);
            return false;
        }
    }
}
