console.log('dashboardApp.js loaded');

import { auth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInAnonymously } from '/firebaseConfig.js';
import { enhancedDataManager } from './data/enhancedDataManager.js';
import { showStatusMessage } from './utils/ui.js';
import { symptomTracker, showSymptomTracker } from './features/symptomTracker.js';

class DashboardApp {
    constructor() {
        this.dataManager = enhancedDataManager;
        this.loadingIndicator = null;
        this.uiComponents = new UIComponents();
        
        // Set up data manager callbacks
        this.dataManager.onStatusMessage((message, type) => {
            showStatusMessage(message, type);
        });
    }

    async init() {
        console.log('Initializing Dashboard App...');
        
        this.loadingIndicator = document.getElementById('loading-overlay');
        
        // Set up auth state listener
        onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? 'User signed in' : 'No user');
            
            if (user) {
                this.showLoading('Loading your data...');
                
                // Set user ID in data manager
                this.dataManager.setUserId(user.uid);
                
                // Initialize symptom tracker
                symptomTracker.setDataManager(this.dataManager);
                symptomTracker.setCurrentUser(user);
                symptomTracker.onStatus((message, type) => {
                    showStatusMessage(message, type);
                });
                
                // Load user data and check onboarding status
                try {
                    const onboardingCompleted = await this.dataManager.loadUserData();
                    
                    // For non-anonymous users, check if onboarding is completed
                    if (!user.isAnonymous && !onboardingCompleted) {
                        console.log('User has not completed onboarding, redirecting...');
                        this.hideLoading();
                        showStatusMessage('Please complete your profile setup first.', 'info');
                        setTimeout(() => {
                            window.location.href = '/profile.html?onboarding=true';
                        }, 1000);
                        return;
                    }
                    
                    // If anonymous user and no data, initialize defaults
                    if (user.isAnonymous && this.dataManager.getData().hospitals.length === 0) {
                        await this.dataManager.initializeDefaultData();
                    }
                    
                    // Update UI and render dashboard
                    this.updateAuthUI(user);
                    this.renderAll();
                    this.hideLoading();
                    
                    // Add entrance animations
                    this.animateElementsEntrance();
                    
                } catch (error) {
                    console.error('Error loading user data:', error);
                    this.hideLoading();
                    showStatusMessage('Error loading your data. Please refresh the page.', 'error');
                }
                
            } else {
                // Not signed in, redirect to login
                window.location.href = '/index.html';
            }
        });
        
        this.setupEventListeners();
    }

    // Show loading indicator
    showLoading(message = 'Loading...') {
        if (this.loadingIndicator) {
            const loaderText = this.loadingIndicator.querySelector('#loader-text');
            if (loaderText) {
                loaderText.textContent = message;
            }
            this.loadingIndicator.style.display = 'flex';
        }
    }

    // Hide loading indicator
    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    // Render all data
    renderAll() {
        try {
            console.log('Rendering dashboard data...');
            const data = this.dataManager.getData();
            console.log('Data to render:', data);
            
            this.uiComponents.renderGreetingAndActions();
            this.renderHospitals();
            this.renderAmbulance();
            this.uiComponents.addRecentActivitySection();
            this.updateQuickStats();
        } catch (error) {
            console.error("Error rendering data:", error);
            showStatusMessage("Error displaying data.", "error");
        }
    }

    // Render hospitals
    renderHospitals() {
        const searchTerm = document.getElementById('hospital-search')?.value || '';
        const data = this.dataManager.getData();
        const allData = data.hospitals || [];
        const filteredData = this.dataManager.getFilteredData('hospitals', searchTerm);
        
        this.uiComponents.renderList('hospitals', filteredData, searchTerm, allData);
        this.uiComponents.renderStats('hospitals', allData);
    }

    // Render ambulance services
    renderAmbulance() {
        const searchTerm = document.getElementById('ambulance-search')?.value || '';
        const data = this.dataManager.getData();
        const allData = data.ambulance || [];
        const filteredData = this.dataManager.getFilteredData('ambulance', searchTerm);
        
        this.uiComponents.renderList('ambulance', filteredData, searchTerm, allData);
        this.uiComponents.renderStats('ambulance', allData);
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
    updateGreeting(displayName) {
        const greetingElement = document.getElementById('personal-greeting');
        if (greetingElement) {
            const data = this.dataManager.getData();
            const hospitalCount = data.hospitals?.length || 0;
            const ambulanceCount = data.ambulance?.length || 0;
            const visitedHospitals = data.hospitals?.filter(h => h.visited)?.length || 0;
            const visitedAmbulance = data.ambulance?.filter(a => a.visited)?.length || 0;
            
            greetingElement.textContent = `Welcome ${displayName}! You've visited ${visitedHospitals}/${hospitalCount} hospitals and ${visitedAmbulance}/${ambulanceCount} ambulance services.`;
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
        const showStatsBtn = document.getElementById('show-stats-btn');
        const showMapBtn = document.getElementById('show-map-btn');
        const showAwardsBtn = document.getElementById('show-awards-btn');

        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => {
                showSymptomTracker();
            });
        }

        if (showProfileBtn) {
            showProfileBtn.addEventListener('click', () => {
                window.location.href = '/profile.html';
            });
        }

        if (showStatsBtn) {
            showStatsBtn.addEventListener('click', () => {
                showStatusMessage('Statistics feature coming soon!', 'info');
            });
        }

        if (showMapBtn) {
            showMapBtn.addEventListener('click', () => {
                showStatusMessage('Map feature coming soon!', 'info');
            });
        }

        if (showAwardsBtn) {
            showAwardsBtn.addEventListener('click', () => {
                showStatusMessage('Awards feature coming soon!', 'info');
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

        // List interaction handlers
        const hospitalsList = document.getElementById('hospitals-list');
        const ambulanceList = document.getElementById('ambulance-list');

        if (hospitalsList) {
            hospitalsList.addEventListener('click', (e) => this.handleInteraction(e));
        }

        if (ambulanceList) {
            ambulanceList.addEventListener('click', (e) => this.handleInteraction(e));
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            console.log('Sign-out successful');
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Sign-out error:', error);
            showStatusMessage('Error signing out. Please try again.', 'error');
        }
    }

    // Add entrance animations method
    animateElementsEntrance() {
        // Animate main content cards
        const cards = document.querySelectorAll('.bg-white');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
        
        // Animate action buttons
        const buttons = document.querySelectorAll('#show-stats-btn, #show-map-btn, #show-awards-btn');
        buttons.forEach((button, index) => {
            button.style.opacity = '0';
            button.style.transform = 'scale(0.8)';
            button.style.transition = 'all 0.4s ease';
            
            setTimeout(() => {
                button.style.opacity = '1';
                button.style.transform = 'scale(1)';
            }, 800 + (index * 100));
        });
    }
}

// UI Components class to handle rendering
class UIComponents {
    renderGreetingAndActions() {
        // This method can be expanded as needed
        console.log('Rendering greeting and actions');
    }

    renderList(type, data, searchTerm = '', originalData = null) {
        const containerId = type === 'hospitals' ? 'hospitals-list' : 'ambulance-list';
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = '';

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-gray-500 text-center py-8">
                    <p>No ${type} found${searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                </div>
            `;
            return;
        }

        data.forEach((item, filteredIndex) => {
            // Find the original index in the full dataset
            const originalIndex = originalData ? originalData.findIndex(originalItem => 
                originalItem.name === item.name && originalItem.location === item.location
            ) : filteredIndex;
            
            const listItem = this.createListItem(type, item, originalIndex);
            container.appendChild(listItem);
        });
    }

    createListItem(type, item, index) {
        const listItem = document.createElement('div');
        listItem.className = 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow';
        
        const isVisited = item.visited || false;
        const count = item.count || 0;
        
        listItem.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1">
                    <div class="flex-shrink-0 mt-1">
                        <input 
                            type="checkbox" 
                            ${isVisited ? 'checked' : ''} 
                            data-type="${type}" 
                            data-index="${index}" 
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        >
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-medium text-gray-900 ${isVisited ? 'text-green-600' : ''}">
                            ${item.name || 'Unnamed Location'}
                        </h4>
                        ${item.city ? `<p class="text-sm text-gray-600 mt-1">${item.city}</p>` : ''}
                        ${count > 0 ? `<p class="text-xs text-blue-600 mt-1">Visits: ${count}</p>` : ''}
                    </div>
                </div>
                <div class="flex-shrink-0 ml-4">
                    <div class="flex items-center space-x-2">
                        <button 
                            data-type="${type}" 
                            data-index="${index}" 
                            data-action="increase"
                            class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-600 transition-colors text-sm"
                            title="Add visit"
                        >
                            +
                        </button>
                        ${count > 0 ? `
                        <button 
                            data-type="${type}" 
                            data-index="${index}" 
                            data-action="decrease"
                            class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors text-sm"
                            title="Remove visit"
                        >
                            -
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        return listItem;
    }

    renderStats(type, data) {
        const statsElement = document.getElementById(`${type}-stats`);
        if (!statsElement) return;
        
        const total = data.length;
        const visited = data.filter(item => item.visited).length;
        const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
        
        statsElement.innerHTML = `
            <div class="text-sm text-gray-600">
                Progress: ${visited}/${total} (${percentage}%)
                <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                         style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }

    addRecentActivitySection() {
        // Implementation for recent activity
        console.log('Adding recent activity section');
    }

    updateQuickStats(hospitalStats, ambulanceStats) {
        // Implementation for quick stats update
        console.log('Updating quick stats:', hospitalStats, ambulanceStats);
    }
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

export { DashboardApp };
