const functions = require('firebase-functions');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

admin.initializeApp();

// Serve authentication JavaScript dynamically
exports.authScript = functions.https.onRequest((req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
  
  const authScript = `
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
`;
  
  res.send(authScript);
});

// Serve login JavaScript dynamically  
exports.loginScript = functions.https.onRequest((req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=300');
  
  const loginScript = `
import { FirebaseAuth } from '/js/auth.js';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseAuth = new FirebaseAuth();
await firebaseAuth.initialize();
const auth = firebaseAuth.getAuth();

firebaseAuth.onAuthChange(({ user }) => {
  if (user) {
    window.location.href = '/dashboard.html';
  }
});

function showLoginStatusMessage(message, type = 'error') {
  const msgDiv = document.getElementById('login-status-message');
  if (!msgDiv) return;
  msgDiv.textContent = message;
  msgDiv.className = type === 'error' ? 'text-red-600' : 'text-green-600';
  msgDiv.style.opacity = 1;
  setTimeout(() => { msgDiv.style.opacity = 0; }, 6000);
}

// Google Sign-In
const googleBtn = document.getElementById('google-signin-btn');
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      showLoginStatusMessage(error.message);
    }
  });
}

// Microsoft Sign-In  
const msBtn = document.getElementById('microsoft-signin-btn');
if (msBtn) {
  msBtn.addEventListener('click', async () => {
    try {
      const provider = new OAuthProvider('microsoft.com');
      await signInWithPopup(auth, provider);
    } catch (error) {
      showLoginStatusMessage(error.message);
    }
  });
}

// Guest Sign-In
const guestBtn = document.getElementById('guest-signin-btn');
const guestModal = document.getElementById('guest-modal');
const guestContinueBtn = document.getElementById('guest-continue-btn');
const guestCancelBtn = document.getElementById('guest-cancel-btn');

if (guestBtn) {
  guestBtn.addEventListener('click', () => {
    guestModal?.classList.remove('hidden');
  });
}

if (guestContinueBtn) {
  guestContinueBtn.addEventListener('click', async () => {
    try {
      await signInAnonymously(auth);
      showLoginStatusMessage('Signed in as guest successfully!', 'success');
      guestModal?.classList.add('hidden');
    } catch (error) {
      showLoginStatusMessage(error.message);
    }
  });
}

if (guestCancelBtn) {
  guestCancelBtn.addEventListener('click', () => {
    guestModal?.classList.add('hidden');
  });
}
`;

  res.send(loginScript);
});

exports.authRedirect = functions.https.onRequest((req, res) => {
  const path = req.path || req.url;
  
  // Allow access to root, index.html, and profile pages without auth
  if (path === '/' || 
      path === '/index.html' || 
      path.includes('index.html') || 
      path.includes('profile.html') ||
      path === '' ||
      path.startsWith('/firebaseConfig.js') ||
      path.startsWith('/logo.svg') ||
      path.startsWith('/styles/')) {
    return res.status(200).send('OK');
  }
  
  // For other pages, you might want to implement auth checking here
  // For now, just allow access
  res.status(200).send('OK');
});
