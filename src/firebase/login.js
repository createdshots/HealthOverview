// Modular login logic for HospitalTracker
import { FirebaseAuth } from './auth.js';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseAuth = new FirebaseAuth();
await firebaseAuth.initialize();
const auth = firebaseAuth.getAuth();

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

function showEmailCombinedModal() {
  // Modal HTML and logic (can be further modularized)
  // ...
  // For brevity, you can move modal logic to a separate file if needed
}

// Export for testing
export { showLoginStatusMessage, showEmailCombinedModal };
