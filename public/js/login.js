import { FirebaseAuth } from './auth.js';
import { GoogleAuthProvider, OAuthProvider, signInWithPopup, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseAuth = new FirebaseAuth();
await firebaseAuth.initialize();
const auth = firebaseAuth.getAuth();

firebaseAuth.onAuthChange(({ user }) => {
  if (user) {
    // Check for admin access before redirecting
    checkAdminAccessAndRedirect(user);
  }
});

// Check admin access and handle redirection
async function checkAdminAccessAndRedirect(user) {
  // Check if user has admin access
  const isAdmin = user.email && user.email.endsWith('@healthoverview.info') && user.emailVerified;
  
  if (isAdmin) {
    console.log('🛡️ Admin user detected:', user.email);
    // Store admin status for the session
    sessionStorage.setItem('isHealthOverviewAdmin', 'true');
  } else {
    // Clear any existing admin status
    sessionStorage.removeItem('isHealthOverviewAdmin');
  }
  
  // Redirect to dashboard
  window.location.href = '/dashboard.html';
}

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
      showLoginStatusMessage('Signing in with Google...', 'success');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      showLoginStatusMessage(error.message);
    }
  });
}

// Microsoft Sign-In  
const msBtn = document.getElementById('microsoft-signin-btn');
if (msBtn) {
  msBtn.addEventListener('click', async () => {
    try {
      showLoginStatusMessage('Signing in with Microsoft...', 'success');
      const provider = new OAuthProvider('microsoft.com');
      // Make sure these scopes are enabled in your Azure app
      provider.addScope('openid');
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Microsoft sign-in error:', error);
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
      showLoginStatusMessage('Signing in as guest...', 'success');
      await signInAnonymously(auth);
      showLoginStatusMessage('Signed in as guest successfully!', 'success');
      guestModal?.classList.add('hidden');
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      showLoginStatusMessage(error.message);
    }
  });
}

if (guestCancelBtn) {
  guestCancelBtn.addEventListener('click', () => {
    guestModal?.classList.add('hidden');
  });
}

// Admin Access Button
const adminBtn = document.getElementById('admin-login-btn');
if (adminBtn) {
  adminBtn.addEventListener('click', () => {
    // Direct navigation to admin panel
    window.location.href = '/admin.html';
  });
}