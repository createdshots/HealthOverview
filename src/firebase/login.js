// Modular login logic for HospitalTracker
import { FirebaseAuth } from './auth.js';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendSignInLinkToEmail, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseAuth = new FirebaseAuth();
await firebaseAuth.initialize();
const auth = firebaseAuth.getAuth();

// Set up auth state listener to redirect after successful login
firebaseAuth.onAuthChange(({ user }) => {
  if (user) {
    // User successfully authenticated, redirect to dashboard
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

// Email Sign-In Modal
const emailBtn = document.getElementById('email-signin-btn');
if (emailBtn) {
  emailBtn.addEventListener('click', showEmailCombinedModal);
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

function showEmailCombinedModal() {
  // Modal HTML and logic (can be further modularized)
  // ...
  // For brevity, you can move modal logic to a separate file if needed
}

// Export for testing
export { showLoginStatusMessage, showEmailCombinedModal };
