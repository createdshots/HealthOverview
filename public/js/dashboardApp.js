console.log('dashboardApp.js loaded');
// Main Dashboard Application - modular version
import { enhancedDataManager } from './data/enhancedDataManager.js';
import { modalManager } from './components/modal.js';
import { uiComponents } from './utils/uiComponents.js';
import { medicalRecordsManager } from './features/medicalRecords.js';
import { auth, signOut, onAuthStateChanged } from '../firebaseConfig.js';

class DashboardApp {
    constructor() {
        this.dataManager = enhancedDataManager;
        this.modalManager = modalManager;
        this.uiComponents = uiComponents;
        this.medicalRecords = medicalRecordsManager;
        this.loadingIndicator = null;
        this.currentUser = null;
        
        // Bind methods to preserve context
        this.handleInteraction = this.handleInteraction.bind(this);
        this.renderAll = this.renderAll.bind(this);
    }

    // Initialize the dashboard application
    async init() {
        console.log('Initializing Dashboard App...');
        
        // Setup loading indicator
        this.loadingIndicator = document.getElementById('loading-overlay');
        
        // Setup status message callback
        this.dataManager.onStatusMessage((message, type) => {
            this.uiComponents.showStatusMessage(message, type);
        });

        // Setup medical records manager
        this.medicalRecords.setDataManager(this.dataManager);
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Initialize authentication
        this.initAuth();
        
        // Make app globally accessible for legacy compatibility
        window.dashboardApp = this;
        
        console.log('Dashboard App initialized');
    }

    // Initialize authentication
    initAuth() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            this.updateAuthUI(user);
            
            if (user) {
                console.log('User authenticated:', user.uid);
                this.dataManager.setUserId(user.uid);
                
                // Check if user needs onboarding
                try {
                    const { userData, onboardingCompleted } = await this.checkOnboardingStatus(user.uid);
                    
                    if (!onboardingCompleted) {
                        // Redirect to profile with onboarding flag
                        window.location.href = '/profile.html?onboarding=true';
                        return;
                    }
                } catch (error) {
                    console.error('Error checking onboarding status:', error);
                }
                
                await this.loadUserData();
            } else {
                console.log('No user authenticated');
                this.dataManager.setUserId(null);
                this.hideLoading();
            }
        });
    }

    // Check if user has completed onboarding
    async checkOnboardingStatus(userId) {
        try {
            const { loadUserData } = await import('./data/enhancedDataManager.js');
            return await loadUserData(userId);
        } catch (error) {
            console.error('Error loading user data:', error);
            return { userData: null, onboardingCompleted: false };
        }
    }

    // Update authentication UI
    updateAuthUI(user) {
        const signedInView = document.getElementById('auth-signed-in-view');
        const userIdDisplay = document.getElementById('user-id-display');
        const addRecordBtn = document.getElementById('add-record-btn');
        const showProfileBtn = document.getElementById('show-profile-btn');

        if (user) {
            // User is signed in
            if (signedInView) {
                signedInView.classList.remove('hidden');
                signedInView.classList.add('flex');
            }
            
            const displayName = user.displayName || user.email || (user.isAnonymous ? 'Guest User' : 'Anonymous');
            if (userIdDisplay) userIdDisplay.textContent = displayName;
            
            // Show authenticated user buttons
            if (addRecordBtn) addRecordBtn.classList.remove('hidden');
            if (showProfileBtn) showProfileBtn.classList.remove('hidden');
            
            // Update greeting
            this.updateGreeting(displayName);
        } else {
            // User is signed out, redirect to login page
            window.location.href = '/index.html';
        }
    }

    // Update greeting
    updateGreeting(name) {
        const greetingDiv = document.getElementById('personal-greeting');
        if (greetingDiv) {
            greetingDiv.textContent = `Hello, ${name}!`;
        }
    }

    // Load user data
    async loadUserData() {
        this.showLoading('Loading your data...');
        
        try {
            const success = await this.dataManager.loadUserData();
            if (success) {
                this.renderAll();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.uiComponents.showStatusMessage('Error loading data. Please refresh the page.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Show loading indicator
    showLoading(message = 'Loading...') {
        if (this.loadingIndicator) {
            const loaderText = this.loadingIndicator.querySelector('#loader-text');
            if (loaderText) {
                loaderText.textContent = message;
            }
            this.loadingIndicator.style.display = 'flex';
        } else {
            this.uiComponents.showLoading(message);
        }
    }

    // Hide loading indicator
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        } else {
            this.uiComponents.hideLoading();
        }
    }

    // Render all data
    renderAll() {
        try {
            this.uiComponents.renderGreetingAndActions();
            this.renderHospitals();
            this.renderAmbulance();
            this.uiComponents.addRecentActivitySection();
            this.updateQuickStats();
        } catch (error) {
            console.error("Error rendering data:", error);
            this.uiComponents.showStatusMessage("Error displaying data.", "error");
        }
    }

    // Render hospitals
    renderHospitals() {
        const searchTerm = document.getElementById('hospital-search')?.value || '';
        const data = this.dataManager.getData();
        const filteredData = this.dataManager.getFilteredData('hospitals', searchTerm);
        
        this.uiComponents.renderList('hospitals', filteredData, searchTerm);
        this.uiComponents.renderStats('hospitals', data.hospitals || []);
    }

    // Render ambulance services
    renderAmbulance() {
        const searchTerm = document.getElementById('ambulance-search')?.value || '';
        const data = this.dataManager.getData();
        const filteredData = this.dataManager.getFilteredData('ambulance', searchTerm);
        
        this.uiComponents.renderList('ambulance', filteredData, searchTerm);
        this.uiComponents.renderStats('ambulance', data.ambulance || []);
    }

    // Update quick stats
    updateQuickStats() {
        const data = this.dataManager.getData();
        const hospitalStats = this.dataManager.getStats('hospitals');
        const ambulanceStats = this.dataManager.getStats('ambulance');
        
        this.uiComponents.updateQuickStats(hospitalStats, ambulanceStats);
    }

    // Handle data interactions
    handleInteraction(event) {
        const result = this.dataManager.handleInteraction(event);
        if (result) {
            this.renderAll();
        }
    }

    // Authentication methods
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            const result = await signInWithPopup(auth, provider);
            console.log('Google sign-in successful:', result.user);
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.uiComponents.showStatusMessage('Error signing in with Google. Please try again.', 'error');
        }
    }

    async signInWithMicrosoft() {
        try {
            const provider = new OAuthProvider('microsoft.com');
            provider.addScope('profile');
            provider.addScope('email');
            const result = await signInWithPopup(auth, provider);
            console.log('Microsoft sign-in successful:', result.user);
        } catch (error) {
            console.error('Microsoft sign-in error:', error);
            this.uiComponents.showStatusMessage('Error signing in with Microsoft. Please try again.', 'error');
        }
    }

    async signInAsGuest() {
        try {
            const result = await signInAnonymously(auth);
            console.log('Anonymous sign-in successful:', result.user);
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            this.uiComponents.showStatusMessage('Error signing in as guest. Please try again.', 'error');
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            console.log('Sign-out successful');
            // Redirect to login page after sign out
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Sign-out error:', error);
            this.uiComponents.showStatusMessage('Error signing out. Please try again.', 'error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Authentication buttons
        const signOutBtn = document.getElementById('signout-btn');

        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }

        // Feature buttons
        const addRecordBtn = document.getElementById('add-record-btn');
        const showProfileBtn = document.getElementById('show-profile-btn');

        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => {
                this.medicalRecords.showAddRecordModal();
            });
        }

        if (showProfileBtn) {
            showProfileBtn.addEventListener('click', () => {
                window.location.href = '/profile.html';
            });
        }

        // Search functionality
        const hospitalSearch = document.getElementById('hospital-search');
        const ambulanceSearch = document.getElementById('ambulance-search');

        if (hospitalSearch) {
            hospitalSearch.addEventListener('input', () => this.renderHospitals());
        }

        if (ambulanceSearch) {
            ambulanceSearch.addEventListener('input', () => this.renderAmbulance());
        }

        // Delegate click events for list interactions
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Handle data interactions
            if (target.dataset.type && (target.type === 'checkbox' || target.dataset.action)) {
                this.handleInteraction(event);
            }
        });

        // Feature modals
        const showStatsBtn = document.getElementById('show-stats-btn');
        const showMapBtn = document.getElementById('show-map-btn');
        const showAwardsBtn = document.getElementById('show-awards-btn');

        if (showStatsBtn) {
            showStatsBtn.addEventListener('click', () => {
                this.uiComponents.showStatusMessage('Charts feature coming soon!', 'info');
            });
        }

        if (showMapBtn) {
            showMapBtn.addEventListener('click', () => {
                this.uiComponents.showStatusMessage('Map feature coming soon!', 'info');
            });
        }

        if (showAwardsBtn) {
            showAwardsBtn.addEventListener('click', () => {
                this.uiComponents.showStatusMessage('Awards feature coming soon!', 'info');
            });
        }
    }
}

// Helper function to create version badges
function createVersionBadges() {
    const badgeContainer = document.createElement('div');
    badgeContainer.id = 'version-badges';
    badgeContainer.style.position = 'fixed';
    badgeContainer.style.bottom = '16px';
    badgeContainer.style.right = '16px';
    badgeContainer.style.zIndex = '1000';
    badgeContainer.style.display = 'flex';
    badgeContainer.style.flexDirection = 'column';
    badgeContainer.style.alignItems = 'flex-end';
    badgeContainer.style.gap = '8px';
    badgeContainer.style.pointerEvents = 'none';
    document.body.appendChild(badgeContainer);

    // Build version badge
    const buildDiv = document.createElement('div');
    buildDiv.id = 'build-badge';
    buildDiv.textContent = 'Build: unknown';
    buildDiv.style.background = '#fff';
    buildDiv.style.color = '#6b7280';
    buildDiv.style.fontWeight = '500';
    buildDiv.style.fontSize = '0.875rem';
    buildDiv.style.padding = '4px 12px';
    buildDiv.style.borderRadius = '8px';
    buildDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    buildDiv.style.opacity = '0.8';
    buildDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    badgeContainer.appendChild(buildDiv);

    // Fetch latest commit hash from GitHub API
    fetch('https://api.github.com/repos/createdshots/ambulance-hospitaltracker/commits/main')
        .then(res => res.ok ? res.json() : null)
        .then((data) => {
            if (data && data.sha) {
                const shortSha = data.sha.substring(0, 7);
                buildDiv.innerHTML = `<a href="https://github.com/createdshots/ambulance-hospitaltracker/commit/${data.sha}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;pointer-events:auto;">Build: <span style='font-family:monospace;'>${shortSha}</span></a>`;
            }
        })
        .catch(() => {
            // fallback, already set
        });

    // Work-in-progress badge
    const wipBadge = document.createElement('div');
    wipBadge.id = 'wip-badge';
    wipBadge.innerHTML = `<span style="font-size:1.1em;vertical-align:middle;">🚧</span> <span style="vertical-align:middle;">Work in Progress</span>`;
    wipBadge.style.background = '#fff';
    wipBadge.style.color = '#b45309';
    wipBadge.style.fontWeight = '500';
    wipBadge.style.fontSize = '1rem';
    wipBadge.style.padding = '4px 14px';
    wipBadge.style.borderRadius = '10px';
    wipBadge.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
    wipBadge.style.opacity = '0.92';
    wipBadge.style.pointerEvents = 'none';
    badgeContainer.appendChild(wipBadge);
}

// Initialize the dashboard when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

async function startApp() {
    const app = new DashboardApp();
    await app.init();
    createVersionBadges();
}

export { DashboardApp };
