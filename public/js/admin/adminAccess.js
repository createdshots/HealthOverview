// Admin access checker and button manager
class AdminAccessManager {
    constructor() {
        this.isAdminUser = false;
        this.adminButton = null;
    }

    // Check if current user has admin access
    checkAdminAccess(user) {
        if (!user || !user.email) {
            this.isAdminUser = false;
            this.hideAdminButton();
            return false;
        }

        // Check for @healthoverview.info domain and email verification
        const isHealthOverviewDomain = user.email.endsWith('@healthoverview.info');
        const isVerified = user.emailVerified;

        this.isAdminUser = isHealthOverviewDomain && isVerified;
        
        if (this.isAdminUser) {
            this.showAdminButton();
        } else {
            this.hideAdminButton();
        }

        return this.isAdminUser;
    }

    // Create and show admin button
    showAdminButton() {
        // Remove existing button if any
        this.hideAdminButton();

        // Create admin button
        this.adminButton = document.createElement('div');
        this.adminButton.id = 'admin-access-button';
        this.adminButton.className = 'fixed bottom-4 left-4 z-50';
        
        this.adminButton.innerHTML = `
            <button class="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl shadow-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 border border-red-500">
                <span class="text-lg">🛡️</span>
                <span class="font-semibold text-sm">Admin Panel</span>
            </button>
        `;

        // Add click handler
        this.adminButton.addEventListener('click', () => {
            this.navigateToAdminPanel();
        });

        // Add to body
        document.body.appendChild(this.adminButton);

        console.log('🛡️ Admin button shown for', this.getCurrentUserEmail());
    }

    // Helper method to get current user email safely
    getCurrentUserEmail() {
        // Try to get from Firebase auth
        if (typeof window !== 'undefined' && window.auth && window.auth.currentUser) {
            return window.auth.currentUser.email;
        }
        return 'unknown user';
    }

    // Hide admin button
    hideAdminButton() {
        if (this.adminButton) {
            this.adminButton.remove();
            this.adminButton = null;
        }
    }

    // Navigate to admin panel with security check
    navigateToAdminPanel() {
        if (!this.isAdminUser) {
            this.showAccessDeniedMessage();
            return;
        }

        // Show confirmation dialog before navigating
        this.showAdminConfirmationDialog();
    }

    // Show confirmation dialog for admin access
    showAdminConfirmationDialog() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <div class="text-center">
                    <div class="text-4xl mb-4">🛡️</div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Admin Panel Access</h3>
                    <p class="text-gray-600 mb-2">You are about to access the admin panel.</p>
                    <p class="text-sm text-orange-600 mb-6">⚠️ You will be redirected to the secure admin interface.</p>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                        <p class="text-sm text-blue-800">
                            <strong>Security Notice:</strong><br>
                            Access is logged and monitored for security purposes.
                        </p>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button id="admin-cancel" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button id="admin-proceed" class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                            Proceed to Admin
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        modal.querySelector('#admin-cancel').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#admin-proceed').addEventListener('click', () => {
            modal.remove();
            window.location.href = '/admin.html';
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Show access denied message
    showAccessDeniedMessage() {
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
        message.innerHTML = `
            <div class="flex items-center justify-between">
                <span>⚠️ Admin access denied. @healthoverview.info email required.</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">×</button>
            </div>
        `;

        document.body.appendChild(message);

        // Animate in
        setTimeout(() => {
            message.classList.remove('translate-x-full');
        }, 100);

        // Auto remove
        setTimeout(() => {
            if (message.parentNode) {
                message.classList.add('translate-x-full');
                setTimeout(() => message.remove(), 300);
            }
        }, 5000);
    }
}

// Global admin access manager
const adminAccessManager = new AdminAccessManager();

// Export for use in other modules
export { adminAccessManager };
