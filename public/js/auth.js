import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, getDoc, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
        try {
            if (typeof window.userFirebaseConfig === 'undefined') {
                throw new Error('Firebase configuration not found. Make sure firebaseConfig.js is loaded.');
            }
            
            console.log('Initializing Firebase with config:', window.userFirebaseConfig);
            this.app = initializeApp(window.userFirebaseConfig);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app);
            
            // Test Firebase connection
            console.log('Firebase initialized successfully');
            console.log('Auth instance:', this.auth);
            console.log('Firestore instance:', this.db);
            
            this.setupAuthListener();
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw error;
        }
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, async (user) => {
            console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
            
            if (this.unsubscribe) {
                this.unsubscribe();
            }

            if (user) {
                this.userId = user.uid;
                this.docRef = doc(this.db, "users", this.userId);
                
                // Check if user needs onboarding (only for non-anonymous Google users)
                if (!user.isAnonymous && user.providerData[0]?.providerId === 'google.com') {
                    try {
                        const userDoc = await getDoc(this.docRef);
                        if (!userDoc.exists()) {
                            console.log('New user detected, redirecting to profile setup');
                            window.location.href = '/profile.html?onboarding=1';
                            return;
                        }
                    } catch (error) {
                        console.error('Error checking user document:', error);
                    }
                }

                if (this.onAuthChangeCallback) {
                    this.onAuthChangeCallback({ user });
                }
                
                // Only setup data listener for non-anonymous users
                if (!user.isAnonymous) {
                    this.setupDataListener();
                }
            } else {
                this.userId = null;
                this.docRef = null;
                
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath === '/' || currentPath.includes('index.html');
                
                if (!isOnLoginPage && !currentPath.includes('profile.html')) {
                    console.log('User not authenticated, redirecting to login');
                    window.location.href = '/';
                } else {
                    if (this.onAuthChangeCallback) {
                        this.onAuthChangeCallback({ user: null });
                    }
                }
            }
        }, (error) => {
            console.error('Auth state change error:', error);
        });
    }

    setupDataListener() {
        if (!this.docRef) return;
        
        this.unsubscribe = onSnapshot(this.docRef, (snapshot) => {
            if (this.onDataChangeCallback) {
                this.onDataChangeCallback({ 
                    data: snapshot.data(), 
                    exists: snapshot.exists() 
                });
            }
        }, (error) => {
            console.error('Firestore listener error:', error);
        });
    }

    async saveData(data) {
        if (!this.docRef) {
            console.warn('Cannot save data: no document reference');
            return false;
        }
        
        try {
            await setDoc(this.docRef, data, { merge: true });
            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error("Error saving data:", error);
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
            console.log('User signed out successfully');
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            return false;
        }
    }
}