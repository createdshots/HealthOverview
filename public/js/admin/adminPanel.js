// Enhanced Admin Panel with Microsoft Security Groups
import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    OAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore,
    doc,
    setDoc,
    getDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class AdminPanel {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentAdmin = null;
        this.users = [];
        this.filteredUsers = [];
        this.reauthenticationRequired = true; // Force re-auth for security
        
        // DOM elements
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.adminLogin = document.getElementById('admin-login');
        this.adminDashboard = document.getElementById('admin-dashboard');
        this.confirmationModal = document.getElementById('confirmation-modal');
    }

    async init() {
        console.log('🛡️ Initializing Admin Panel...');
        
        try {
            // Check if config is loaded
            if (typeof window.userFirebaseConfig === 'undefined') {
                throw new Error('Firebase configuration not loaded');
            }

            // Initialize Firebase
            const app = initializeApp(window.userFirebaseConfig);
            this.auth = getAuth(app);
            this.db = getFirestore(app);

            // Set up auth listener
            this.setupAuthListener();
            
            // Set up event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('❌ Failed to initialize admin panel:', error);
            this.showError('Failed to initialize admin panel: ' + error.message);
        }
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, async (user) => {
            console.log('🔐 Auth state changed:', user ? 'Admin signed in' : 'No admin');
            
            if (user) {
                await this.validateAdminAccess(user);
            } else {
                this.showLoginScreen();
            }
        });
    }

    async validateAdminAccess(user) {
        console.log('🔍 Validating admin access for:', user.email);
        
        // Check if user has @healthoverview.info domain
        if (!user.email || !user.email.endsWith('@healthoverview.info')) {
            console.log('❌ Access denied: Invalid domain');
            this.showError('Access denied. Admin access requires @healthoverview.info domain.');
            await signOut(this.auth);
            return;
        }

        // Check if user is verified
        if (!user.emailVerified) {
            console.log('❌ Access denied: Email not verified');
            this.showError('Access denied. Please verify your email address.');
            await signOut(this.auth);
            return;
        }

        // Check if re-authentication is needed (for security)
        const lastSignIn = new Date(user.metadata.lastSignInTime);
        const now = new Date();
        const timeSinceSignIn = now - lastSignIn;
        const fiveMinutes = 5 * 60 * 1000;

        if (this.reauthenticationRequired && timeSinceSignIn > fiveMinutes) {
            console.log('🔒 Re-authentication required for admin access');
            this.showReauthenticationRequired();
            return;
        }

        console.log('✅ Admin access granted');
        this.currentAdmin = user;
        this.showDashboard();
    }

    showReauthenticationRequired() {
        const adminLogin = document.getElementById('admin-login');
        adminLogin.innerHTML = `
            <div class="glass-card rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4">🔐</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Security Verification Required</h2>
                    <p class="text-gray-600 mb-4">For security, please re-authenticate with Microsoft to access the admin panel.</p>
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-yellow-800">
                            <strong>🛡️ Security Notice:</strong><br>
                            Admin access requires fresh authentication with 2FA verification.
                        </p>
                    </div>
                </div>
                
                <button id="microsoft-admin-reauth" class="w-full flex items-center justify-center gap-3 bg-blue-600 border-2 border-blue-700 rounded-xl py-3 px-4 font-semibold text-white hover:bg-blue-700 hover:border-blue-800 shadow-lg transition-all duration-300 transform hover:scale-105">
                    <svg class="w-6 h-6" viewBox="0 0 24 24">
                        <rect fill="#F25022" x="1" y="1" width="10" height="10"/>
                        <rect fill="#7FBA00" x="13" y="1" width="10" height="10"/>
                        <rect fill="#00A4EF" x="1" y="13" width="10" height="10"/>
                        <rect fill="#FFB900" x="13" y="13" width="10" height="10"/>
                    </svg>
                    Re-authenticate with Microsoft
                </button>
                
                <div class="mt-4 text-center">
                    <button id="admin-back-to-dashboard" class="text-gray-500 hover:text-gray-700 text-sm underline">
                        ← Back to Dashboard
                    </button>
                </div>
                
                <div id="admin-reauth-status" class="mt-4 text-center text-sm"></div>
            </div>
        `;

        // Set up re-authentication handlers
        document.getElementById('microsoft-admin-reauth').addEventListener('click', async () => {
            try {
                this.showLoginStatus('Re-authenticating with Microsoft...', 'info');
                
                // Force sign out first
                await signOut(this.auth);
                
                // Then sign in again with forced account selection
                const provider = new OAuthProvider('microsoft.com');
                provider.addScope('mail.read');
                provider.addScope('user.read');
                provider.setCustomParameters({
                    prompt: 'login', // Force re-authentication
                    hd: 'healthoverview.info'
                });

                await signInWithPopup(this.auth, provider);
                this.reauthenticationRequired = false; // Mark as freshly authenticated

            } catch (error) {
                console.error('❌ Microsoft re-authentication error:', error);
                this.showLoginStatus('Re-authentication failed: ' + error.message, 'error');
            }
        });

        document.getElementById('admin-back-to-dashboard').addEventListener('click', () => {
            window.location.href = '/dashboard.html';
        });
    }

    showLoginStatus(message, type) {
        const statusDiv = document.getElementById('admin-reauth-status') || document.getElementById('admin-login-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `mt-4 text-center text-sm ${
                type === 'error' ? 'text-red-600' : type === 'info' ? 'text-blue-600' : 'text-green-600'
            }`;
        }
    }

    // ... rest of existing AdminPanel methods
}

// Make adminPanel available globally for onclick handlers
window.adminPanel = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.adminPanel = new AdminPanel();
    await window.adminPanel.init();
});