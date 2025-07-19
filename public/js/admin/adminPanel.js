// Enhanced Admin Panel with Microsoft Entra ID Authentication
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
        this.azureConfig = null;
        
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

            // Load Azure configuration
            await this.loadAzureConfig();

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

    async loadAzureConfig() {
        try {
            const response = await fetch('/api/admin/azure-config');
            if (response.ok) {
                this.azureConfig = await response.json();
                console.log('✅ Azure config loaded');
            } else {
                throw new Error('Failed to load Azure configuration');
            }
        } catch (error) {
            console.error('❌ Error loading Azure config:', error);
            // Fallback configuration
            this.azureConfig = {
                clientId: null,
                tenantId: null,
                allowedGroups: ['HealthOverview-Admins', 'HealthOverview-Moderators', 'HealthOverview-Support']
            };
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
        
        try {
            // Check domain first
            if (!user.email || !user.email.endsWith('@healthoverview.info')) {
                console.log('❌ Access denied: Invalid domain');
                this.showError('Access denied. Admin access requires @healthoverview.info domain.');
                await signOut(this.auth);
                return;
            }

            // Check email verification
            if (!user.emailVerified) {
                console.log('❌ Access denied: Email not verified');
                this.showError('Access denied. Please verify your email address.');
                await signOut(this.auth);
                return;
            }

            // Get Microsoft Graph token for group validation
            const accessToken = sessionStorage.getItem('msft_graph_token');
            if (accessToken) {
                const groupValidation = await this.validateUserGroups(accessToken, user.email);
                
                if (!groupValidation.success) {
                    console.log('❌ Access denied: Group validation failed');
                    this.showError(groupValidation.error || 'Access denied. You must be a member of an admin security group.');
                    await signOut(this.auth);
                    return;
                }

                // Set admin level based on groups
                this.currentAdmin = { 
                    ...user, 
                    adminLevel: groupValidation.adminLevel, 
                    groups: groupValidation.adminGroups 
                };
            } else {
                // Fallback: Basic domain-based admin access
                console.log('⚠️ No Microsoft Graph token - using domain-based access');
                this.currentAdmin = { 
                    ...user, 
                    adminLevel: 'basic', 
                    groups: [] 
                };
            }

            console.log('✅ Admin access granted with level:', this.currentAdmin.adminLevel);
            this.showDashboard();

        } catch (error) {
            console.error('❌ Error validating admin access:', error);
            this.showError('Failed to validate admin access: ' + error.message);
            await signOut(this.auth);
        }
    }

    async validateUserGroups(accessToken, userEmail) {
        console.log('📋 Validating user groups via backend...');
        
        try {
            const response = await fetch('/api/admin/validate-groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accessToken: accessToken,
                    userEmail: userEmail
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Group validation failed');
            }

            return result;

        } catch (error) {
            console.error('❌ Error validating user groups:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    setupEventListeners() {
        // Microsoft sign-in with enhanced scopes
        document.getElementById('microsoft-admin-signin').addEventListener('click', async () => {
            try {
                this.showLoginStatus('Signing in with Microsoft...', 'info');
                
                const provider = new OAuthProvider('microsoft.com');
                
                // Request necessary scopes for admin operations
                provider.addScope('https://graph.microsoft.com/User.Read');
                provider.addScope('https://graph.microsoft.com/GroupMember.Read.All');
                provider.addScope('openid');
                provider.addScope('email');
                provider.addScope('profile');
                
                // Configure for your Azure tenant
                provider.setCustomParameters({
                    prompt: 'select_account',
                    ...(this.azureConfig.tenantId && { tenant: this.azureConfig.tenantId })
                });

                const result = await signInWithPopup(this.auth, provider);
                
                // Store the Microsoft Graph access token
                const credential = OAuthProvider.credentialFromResult(result);
                if (credential && credential.accessToken) {
                    sessionStorage.setItem('msft_graph_token', credential.accessToken);
                    console.log('✅ Microsoft Graph token stored');
                } else {
                    console.warn('⚠️ No Microsoft Graph token received');
                }

            } catch (error) {
                console.error('❌ Microsoft sign-in error:', error);
                
                // Handle specific error cases
                if (error.code === 'auth/invalid-credential') {
                    this.showLoginStatus('Microsoft authentication failed. Please check your Azure configuration.', 'error');
                } else if (error.code === 'auth/popup-closed-by-user') {
                    this.showLoginStatus('Sign-in cancelled by user.', 'error');
                } else {
                    this.showLoginStatus('Sign-in failed: ' + error.message, 'error');
                }
            }
        });

        // Sign out
        document.getElementById('admin-signout-btn').addEventListener('click', async () => {
            try {
                sessionStorage.removeItem('msft_graph_token');
                await signOut(this.auth);
                this.showSuccess('Signed out successfully');
            } catch (error) {
                console.error('❌ Sign-out error:', error);
                this.showError('Failed to sign out');
            }
        });

        // User management buttons
        document.getElementById('refresh-users-btn').addEventListener('click', () => this.loadUsers());
        document.getElementById('export-users-btn').addEventListener('click', () => this.exportUserData());
        document.getElementById('view-system-stats-btn').addEventListener('click', () => this.showSystemAnalytics());

        // Data management buttons
        document.getElementById('backup-data-btn').addEventListener('click', () => this.createBackup());
        document.getElementById('cleanup-data-btn').addEventListener('click', () => this.cleanupOrphanedData());
        document.getElementById('view-logs-btn').addEventListener('click', () => this.viewSystemLogs());

        // Danger zone buttons
        document.getElementById('delete-inactive-users-btn').addEventListener('click', () => this.deleteInactiveUsers());
        document.getElementById('purge-guest-data-btn').addEventListener('click', () => this.purgeGuestData());
        document.getElementById('nuclear-option-btn').addEventListener('click', () => this.nuclearOption());

        // User search and filter
        document.getElementById('user-search').addEventListener('input', (e) => this.filterUsers());
        document.getElementById('user-filter').addEventListener('change', (e) => this.filterUsers());

        // Modal handlers
        document.getElementById('modal-cancel').addEventListener('click', () => this.hideConfirmationModal());
        document.getElementById('modal-confirm').addEventListener('click', () => this.executeConfirmedAction());
    }

    showLoginScreen() {
        this.loadingOverlay.style.display = 'none';
        this.adminLogin.classList.remove('hidden');
        this.adminDashboard.classList.add('hidden');
    }

    async showDashboard() {
        console.log('📊 Loading admin dashboard...');
        
        try {
            // Update admin info display
            document.getElementById('admin-name').textContent = this.currentAdmin.displayName || 'Admin';
            document.getElementById('admin-email').textContent = this.currentAdmin.email;
            
            // Show admin level badge if available
            const adminInfo = document.getElementById('admin-user-info');
            
            // Remove existing badge
            const existingBadge = adminInfo.querySelector('.admin-level-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            // Add admin level badge
            if (this.currentAdmin.adminLevel) {
                const levelBadge = document.createElement('div');
                levelBadge.className = `text-xs px-2 py-1 rounded-full admin-level-badge ${this.getAdminLevelColor(this.currentAdmin.adminLevel)}`;
                levelBadge.textContent = this.getAdminLevelText(this.currentAdmin.adminLevel);
                adminInfo.appendChild(levelBadge);
            }
            
            adminInfo.classList.remove('hidden');
            document.getElementById('admin-signout-btn').classList.remove('hidden');

            // Adjust UI based on admin level
            this.adjustUIForAdminLevel();

            // Hide login, show dashboard
            this.adminLogin.classList.add('hidden');
            this.adminDashboard.classList.remove('hidden');
            this.loadingOverlay.style.display = 'none';

            // Load initial data
            await this.loadSystemStats();
            await this.loadUsers();

        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
            this.showError('Failed to load dashboard: ' + error.message);
        }
    }

    getAdminLevelColor(level) {
        switch (level) {
            case 'full': return 'bg-red-100 text-red-800';
            case 'moderate': return 'bg-orange-100 text-orange-800';
            case 'readonly': return 'bg-blue-100 text-blue-800';
            case 'basic': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getAdminLevelText(level) {
        switch (level) {
            case 'full': return 'Full Admin';
            case 'moderate': return 'Moderator';
            case 'readonly': return 'Support';
            case 'basic': return 'Basic Access';
            default: return 'Limited';
        }
    }

    adjustUIForAdminLevel() {
        const level = this.currentAdmin.adminLevel;
        
        // Disable dangerous operations for non-full admins
        if (level !== 'full') {
            const dangerButtons = ['delete-inactive-users-btn', 'purge-guest-data-btn', 'nuclear-option-btn'];
            dangerButtons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                    btn.title = 'Requires Full Admin access';
                }
            });
        }

        // Hide certain features for read-only admins
        if (level === 'readonly' || level === 'basic') {
            const restrictedButtons = ['backup-data-btn', 'cleanup-data-btn'];
            restrictedButtons.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.disabled = true;
                    btn.classList.add('opacity-50', 'cursor-not-allowed');
                    btn.title = 'Requires higher admin privileges';
                }
            });
        }
    }

    showLoginStatus(message, type) {
        const statusDiv = document.getElementById('admin-login-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `mt-4 text-center text-sm ${
                type === 'error' ? 'text-red-600' : type === 'info' ? 'text-blue-600' : 'text-green-600'
            }`;
        }
    }

    async loadSystemStats() {
        console.log('📈 Loading system statistics...');
        
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${await this.currentAdmin.getIdToken()}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.updateStatsDisplay(stats);
            } else {
                throw new Error('Failed to load system stats');
            }

        } catch (error) {
            console.error('❌ Error loading stats:', error);
            // Show placeholder data
            this.updateStatsDisplay({
                totalUsers: '---',
                authenticatedUsers: '---',
                guestUsers: '---',
                totalRecords: '---'
            });
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('authenticated-users').textContent = stats.authenticatedUsers || 0;
        document.getElementById('guest-users').textContent = stats.guestUsers || 0;
        document.getElementById('total-records').textContent = stats.totalRecords || 0;
    }

    async loadUsers() {
        console.log('👥 Loading users...');
        
        const loadingDiv = document.getElementById('user-list-loading');
        const tableBody = document.getElementById('user-table-body');
        
        loadingDiv.style.display = 'block';
        tableBody.innerHTML = '';

        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${await this.currentAdmin.getIdToken()}`
                }
            });

            if (response.ok) {
                this.users = await response.json();
                this.filteredUsers = [...this.users];
                this.renderUserTable();
            } else {
                throw new Error('Failed to load users');
            }

        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.showError('Failed to load users: ' + error.message);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        Failed to load users. Please try again.
                    </td>
                </tr>
            `;
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    renderUserTable() {
        const tableBody = document.getElementById('user-table-body');
        
        if (this.filteredUsers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No users found matching your criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.filteredUsers.map(user => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                            ${user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${user.displayName || 'Unknown'}</div>
                            <div class="text-sm text-gray-500">${user.email || 'No email'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isAnonymous ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                    }">
                        ${user.isAnonymous ? 'Guest' : 'Authenticated'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.recordCount || 0} records
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button onclick="adminPanel.viewUser('${user.uid}')" class="text-blue-600 hover:text-blue-900">View</button>
                    <button onclick="adminPanel.exportUser('${user.uid}')" class="text-green-600 hover:text-green-900">Export</button>
                    <button onclick="adminPanel.deleteUser('${user.uid}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    filterUsers() {
        const searchTerm = document.getElementById('user-search').value.toLowerCase();
        const filterType = document.getElementById('user-filter').value;

        this.filteredUsers = this.users.filter(user => {
            // Apply search filter
            const matchesSearch = !searchTerm || 
                (user.displayName && user.displayName.toLowerCase().includes(searchTerm)) ||
                (user.email && user.email.toLowerCase().includes(searchTerm));

            // Apply type filter
            let matchesType = true;
            switch (filterType) {
                case 'authenticated':
                    matchesType = !user.isAnonymous;
                    break;
                case 'guest':
                    matchesType = user.isAnonymous;
                    break;
                case 'inactive':
                    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                    matchesType = !user.lastActive || new Date(user.lastActive).getTime() < thirtyDaysAgo;
                    break;
                default:
                    matchesType = true;
            }

            return matchesSearch && matchesType;
        });

        this.renderUserTable();
    }

    // User management methods
    async viewUser(userId) {
        console.log('👁️ Viewing user:', userId);
        this.showInfo('User details feature coming soon!');
    }

    async exportUser(userId) {
        console.log('📥 Exporting user:', userId);
        this.showInfo('User export feature coming soon!');
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.uid === userId);
        if (!user) return;

        this.showConfirmationModal(
            '🗑️',
            'Delete User',
            `Are you sure you want to delete user "${user.displayName || user.email}"? This action cannot be undone.`,
            () => this.performDeleteUser(userId)
        );
    }

    async performDeleteUser(userId) {
        try {
            const response = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${await this.currentAdmin.getIdToken()}`
                }
            });

            if (response.ok) {
                this.showSuccess('User deleted successfully');
                await this.loadUsers();
                await this.loadSystemStats();
            } else {
                throw new Error('Failed to delete user');
            }

        } catch (error) {
            console.error('❌ Error deleting user:', error);
            this.showError('Failed to delete user: ' + error.message);
        }
    }

    // Confirmation modal methods
    showConfirmationModal(icon, title, message, confirmCallback) {
        document.getElementById('modal-icon').textContent = icon;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        this.pendingConfirmAction = confirmCallback;
        this.confirmationModal.classList.remove('hidden');
    }

    hideConfirmationModal() {
        this.confirmationModal.classList.add('hidden');
        this.pendingConfirmAction = null;
    }

    executeConfirmedAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
        }
        this.hideConfirmationModal();
    }

    // Utility methods
    showLoginStatus(message, type) {
        const statusDiv = document.getElementById('admin-login-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `mt-4 text-center text-sm ${
                type === 'error' ? 'text-red-600' : type === 'info' ? 'text-blue-600' : 'text-green-600'
            }`;
        }
    }

    showSuccess(message) {
        this.showStatusMessage(message, 'success');
    }

    showError(message) {
        this.showStatusMessage(message, 'error');
    }

    showInfo(message) {
        this.showStatusMessage(message, 'info');
    }

    showStatusMessage(message, type) {
        const messageArea = document.getElementById('status-message-area');
        const bgColor = type === 'success' ? 'bg-green-500' : 
                       type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        const messageId = `status-${Date.now()}`;
        
        const messageHtml = `
            <div id="${messageId}" class="mb-2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full">
                <div class="flex items-center justify-between">
                    <span>${message}</span>
                    <button onclick="document.getElementById('${messageId}').remove()" class="ml-4 text-white hover:text-gray-200">
                        ×
                    </button>
                </div>
            </div>
        `;
        
        messageArea.insertAdjacentHTML('beforeend', messageHtml);
        
        // Animate in
        setTimeout(() => {
            const messageEl = document.getElementById(messageId);
            if (messageEl) {
                messageEl.classList.remove('translate-x-full');
            }
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            const messageEl = document.getElementById(messageId);
            if (messageEl) {
                messageEl.classList.add('translate-x-full');
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }

    // Placeholder methods for future implementation
    async exportUserData() {
        this.showInfo('User data export feature coming soon!');
    }

    async showSystemAnalytics() {
        this.showInfo('System analytics feature coming soon!');
    }

    async createBackup() {
        this.showInfo('Data backup feature coming soon!');
    }

    async cleanupOrphanedData() {
        this.showInfo('Data cleanup feature coming soon!');
    }

    async viewSystemLogs() {
        this.showInfo('System logs feature coming soon!');
    }

    async deleteInactiveUsers() {
        this.showConfirmationModal(
            '⚠️',
            'Delete Inactive Users',
            'This will delete all users who haven\'t been active for 30+ days. This action cannot be undone.',
            () => this.showInfo('Delete inactive users feature coming soon!')
        );
    }

    async purgeGuestData() {
        this.showConfirmationModal(
            '💀',
            'Purge Guest Data',
            'This will permanently delete all guest user data. This action cannot be undone.',
            () => this.showInfo('Purge guest data feature coming soon!')
        );
    }

    async nuclearOption() {
        this.showConfirmationModal(
            '☢️',
            'RESET ALL DATA',
            'This will DELETE ALL USER DATA from the system. This action is IRREVERSIBLE. Are you absolutely sure?',
            () => this.showError('Nuclear option disabled for safety!')
        );
    }
}

// Make adminPanel available globally for onclick handlers
window.adminPanel = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.adminPanel = new AdminPanel();
    await window.adminPanel.init();
});