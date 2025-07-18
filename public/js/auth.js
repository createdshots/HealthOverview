import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
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
        if (typeof window.userFirebaseConfig === 'undefined') {
            throw new Error('Firebase configuration not found');
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
                this.userId = null;
                this.docRef = null;
                
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath === '/' || currentPath.includes('index.html');
                
                if (!isOnLoginPage && !currentPath.includes('profile.html')) {
                    window.location.href = '/';
                } else {
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
        });
    }

    async saveData(data) {
        if (!this.docRef) return false;
        try {
            await setDoc(this.docRef, data, { merge: true });
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
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            return false;
        }
    }
}