// UI Components for rendering lists, stats, and interface elements
export class UIComponents {
    constructor() {
        this.statusMessageArea = document.getElementById('status-message-area');
    }

    // Show status message
    showStatusMessage(message, type = 'success') {
        if (!this.statusMessageArea) return;
        
        this.statusMessageArea.textContent = message;
        this.statusMessageArea.className = `status-message mt-4 h-6 font-medium ${type === 'error' ? 'text-red-600' : 'text-green-600'}`;
        this.statusMessageArea.style.opacity = 1;
        setTimeout(() => { this.statusMessageArea.style.opacity = 0; }, 5000);
    }

    // Render list of items (hospitals or ambulances)
    renderList(type, data, searchTerm = '') {
        const listContainer = document.getElementById(`${type}-list`);
        if (!listContainer) return;

        const filteredData = data.filter(item => 
            !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredData.length === 0) {
            listContainer.innerHTML = `<div class="text-gray-500 text-center py-8">No ${type} found${searchTerm ? ` matching "${searchTerm}"` : ''}</div>`;
            return;
        }

        const listHTML = filteredData.map((item, index) => {
            const originalIndex = data.indexOf(item);
            return this.createListItem(item, originalIndex, type);
        }).join('');

        listContainer.innerHTML = listHTML;
    }

    // Create individual list item HTML
    createListItem(item, index, type) {
        const visitedClass = item.visited ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200';
        const checkboxChecked = item.visited ? 'checked' : '';
        const count = item.count || 0;

        return `
            <div class="border ${visitedClass} rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-grow">
                        <input type="checkbox" ${checkboxChecked}
                            data-type="${type}" data-index="${index}"
                            class="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                        <div class="flex-grow">
                            <h3 class="font-medium text-gray-900">${item.name}</h3>
                            ${item.location ? `<p class="text-sm text-gray-600">${item.location}</p>` : ''}
                            ${item.type ? `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">${item.type}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button data-type="${type}" data-index="${index}" data-action="decrease"
                            class="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors ${count === 0 ? 'opacity-50 cursor-not-allowed' : ''}">-</button>
                        <span class="min-w-[2rem] text-center font-semibold text-gray-700">${count}</span>
                        <button data-type="${type}" data-index="${index}" data-action="increase"
                            class="w-8 h-8 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors">+</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Render statistics
    renderStats(type, data) {
        const statsContainer = document.getElementById(`${type}-stats`);
        if (!statsContainer) return;

        const total = data.length;
        const visited = data.filter(item => item.visited).length;
        const totalCount = data.reduce((sum, item) => sum + (item.count || 0), 0);
        const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;

        statsContainer.innerHTML = `
            <div class="bg-gray-50 rounded-lg p-3 text-sm">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium text-gray-700">Progress:</span>
                    <span class="font-bold text-blue-600">${percentage}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div class="text-center">
                        <div class="font-semibold text-gray-800">${visited}</div>
                        <div>Visited</div>
                    </div>
                    <div class="text-center">
                        <div class="font-semibold text-gray-800">${total - visited}</div>
                        <div>Remaining</div>
                    </div>
                    <div class="text-center">
                        <div class="font-semibold text-gray-800">${totalCount}</div>
                        <div>Total Visits</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render greeting and action buttons
    renderGreetingAndActions() {
        const greetingContainer = document.getElementById('personal-greeting');
        if (greetingContainer) {
            // This will be updated by the auth system
            greetingContainer.textContent = 'Hello!';
        }
    }

    // Add recent activity section
    addRecentActivitySection() {
        const container = document.getElementById('recent-activity-container');
        if (!container) return;

        const recentActivityHTML = `
            <div class="bg-white p-6 rounded-xl shadow-md mb-8">
                <h2 class="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
                    <span class="mr-2">📊</span>
                    Quick Stats
                </h2>
                <div id="quick-stats-content" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-blue-600" id="total-hospitals">0</div>
                        <div class="text-sm text-blue-800">Hospitals Tracked</div>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-green-600" id="total-ambulances">0</div>
                        <div class="text-sm text-green-800">Ambulance Services</div>
                    </div>
                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <div class="text-2xl font-bold text-purple-600" id="total-visits">0</div>
                        <div class="text-sm text-purple-800">Total Visits</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = recentActivityHTML;
    }

    // Update quick stats
    updateQuickStats(hospitalStats, ambulanceStats) {
        const totalHospitalsEl = document.getElementById('total-hospitals');
        const totalAmbulancesEl = document.getElementById('total-ambulances');
        const totalVisitsEl = document.getElementById('total-visits');

        if (totalHospitalsEl) totalHospitalsEl.textContent = hospitalStats.visited;
        if (totalAmbulancesEl) totalAmbulancesEl.textContent = ambulanceStats.visited;
        if (totalVisitsEl) totalVisitsEl.textContent = hospitalStats.totalCount + ambulanceStats.totalCount;
    }

    // Create loading indicator
    createLoadingIndicator() {
        return `
            <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50" id="loading-overlay">
                <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span class="text-gray-700">Loading...</span>
                </div>
            </div>
        `;
    }

    // Show loading
    showLoading(message = 'Loading...') {
        const loadingHTML = `
            <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50" id="loading-overlay">
                <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span class="text-gray-700">${message}</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    // Hide loading
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    // Setup search functionality
    setupSearch() {
        const hospitalSearch = document.getElementById('hospital-search');
        const ambulanceSearch = document.getElementById('ambulance-search');

        if (hospitalSearch) {
            hospitalSearch.addEventListener('input', (e) => {
                if (window.dashboardApp && window.dashboardApp.renderHospitals) {
                    window.dashboardApp.renderHospitals();
                }
            });
        }

        if (ambulanceSearch) {
            ambulanceSearch.addEventListener('input', (e) => {
                if (window.dashboardApp && window.dashboardApp.renderAmbulance) {
                    window.dashboardApp.renderAmbulance();
                }
            });
        }
    }

    // Setup event listeners for the interface
    setupEventListeners() {
        this.setupSearch();
        
        // Delegate click events for list interactions
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Handle data interactions
            if (target.dataset.type && (target.type === 'checkbox' || target.dataset.action)) {
                if (window.dashboardApp && window.dashboardApp.handleInteraction) {
                    window.dashboardApp.handleInteraction(event);
                }
            }
        });

        // Handle authentication buttons
        const googleSignInBtn = document.getElementById('google-signin-btn');
        const microsoftSignInBtn = document.getElementById('microsoft-signin-btn');
        const guestSignInBtn = document.getElementById('guest-signin-btn');
        const signOutBtn = document.getElementById('signout-btn');

        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => {
                if (window.dashboardApp && window.dashboardApp.signInWithGoogle) {
                    window.dashboardApp.signInWithGoogle();
                }
            });
        }

        if (microsoftSignInBtn) {
            microsoftSignInBtn.addEventListener('click', () => {
                if (window.dashboardApp && window.dashboardApp.signInWithMicrosoft) {
                    window.dashboardApp.signInWithMicrosoft();
                }
            });
        }

        if (guestSignInBtn) {
            guestSignInBtn.addEventListener('click', () => {
                if (window.dashboardApp && window.dashboardApp.signInAsGuest) {
                    window.dashboardApp.signInAsGuest();
                }
            });
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                if (window.dashboardApp && window.dashboardApp.signOut) {
                    window.dashboardApp.signOut();
                }
            });
        }
    }
}

// Create and export singleton instance
export const uiComponents = new UIComponents();
