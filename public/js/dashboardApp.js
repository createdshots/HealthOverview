console.log('dashboardApp.js loaded');

import { auth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInAnonymously } from '/firebaseConfig.js';
import { enhancedDataManager } from './data/enhancedDataManager.js';
import { showStatusMessage } from './utils/ui.js';
import { symptomTracker, showSymptomTracker } from './features/symptomTracker.js';
import { mapViewer, showMapModal } from './features/mapViewer.js';
import { HealthAI } from './ai/healthAI.js';
import { MedicalEpisodeManager, MEDICAL_ISSUES } from './features/medicalEpisodes.js';

class DashboardApp {
    constructor() {
        this.dataManager = enhancedDataManager;
        this.uiComponents = new UIComponents();
        this.loadingIndicator = null;
        this.healthAI = new HealthAI();
        this.episodeManager = new MedicalEpisodeManager(this.dataManager);
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
                
                // Initialize map viewer
                mapViewer.setDataManager(this.dataManager);
                
                // Load user data and check onboarding status
                try {
                    // Wait a small amount to ensure Firebase is fully initialized
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Ensure user ID is set first
                    console.log('Setting user ID for dashboard data manager:', user.uid);
                    this.dataManager.setUserId(user.uid);
                    
                    // Verify the user ID was set correctly
                    if (!this.dataManager.userId) {
                        throw new Error('Failed to set user ID in dashboard data manager');
                    }
                    
                    // Try to load user data and get onboarding status
                    const onboardingCompleted = await this.dataManager.loadUserData();
                    
                    // Check localStorage as fallback for recent onboarding completion
                    const localOnboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
                    const localOnboardingTime = localStorage.getItem('onboardingCompletedTime');
                    const recentOnboardingCompletion = localOnboardingTime && 
                        (new Date() - new Date(localOnboardingTime)) < 30000; // Within last 30 seconds
                    
                    const isOnboardingComplete = onboardingCompleted || 
                                               (localOnboardingCompleted && recentOnboardingCompletion);
                    
                    // For non-anonymous users, check if onboarding is completed
                    if (!user.isAnonymous && !isOnboardingComplete) {
                        console.log('User has not completed onboarding, redirecting...');
                        this.hideLoading();
                        showStatusMessage('Please complete your profile setup first.', 'info');
                        setTimeout(() => {
                            window.location.href = '/profile.html?onboarding=true';
                        }, 1000);
                        return;
                    }
                    
                    // Clear localStorage flags if onboarding is confirmed complete
                    if (onboardingCompleted) {
                        localStorage.removeItem('onboardingCompleted');
                        localStorage.removeItem('onboardingCompletedTime');
                    }
                    
                    // If anonymous user and no data, initialize defaults
                    if (user.isAnonymous && this.dataManager.getData().hospitals.length === 0) {
                        await this.dataManager.initializeDefaultData();
                    }
                    
                    // Update UI and render dashboard
                    this.updateAuthUI(user);
                    this.renderAll();
                    
                    // Update profile picture after data is loaded (in case it wasn't available during updateAuthUI)
                    const displayName = user.displayName || user.email || (user.isAnonymous ? 'Guest User' : 'Anonymous');
                    this.updateUserProfilePicture(displayName);
                    
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
            console.log('Hospitals:', data.hospitals?.length || 0);
            console.log('Ambulance services:', data.ambulance?.length || 0);
            
            this.renderHospitals();
            this.renderAmbulance();
            this.updateSummaryCards();
            this.updateQuickStats();
            this.renderRecentActivity();
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
        console.log('=== AMBULANCE RENDER START ===');
        const searchTerm = document.getElementById('ambulance-search')?.value || '';
        const data = this.dataManager.getData();
        
        console.log('Rendering ambulance data:', data.ambulance);
        console.log('Ambulance data length:', data.ambulance?.length || 0);
        
        // Ensure ambulance data exists
        if (!data.ambulance || data.ambulance.length === 0) {
            console.log('No ambulance data found, checking if we need to initialize...');
            // Try to trigger data initialization if ambulance array is empty
            this.dataManager.initializeDefaultData().then(() => {
                console.log('Data initialized, re-rendering ambulance list');
                this.renderAmbulance(); // Re-render after initialization
            });
            return;
        }
        
        const filteredData = this.dataManager.getFilteredData('ambulance', searchTerm);
        console.log('Filtered ambulance data:', filteredData);
        console.log('Filtered data length:', filteredData.length);
        
        // Check if container exists
        const container = document.getElementById('ambulance-list');
        console.log('Ambulance container found:', !!container);
        if (container) {
            console.log('Container current children count:', container.children.length);
        }
        
        this.uiComponents.renderList('ambulance', filteredData, searchTerm, data.ambulance);
        this.uiComponents.renderStats('ambulance', data.ambulance || []);
        
        // Verify rendering worked
        setTimeout(() => {
            const containerAfter = document.getElementById('ambulance-list');
            if (containerAfter) {
                console.log('Container children after render:', containerAfter.children.length);
                console.log('Container visibility:', window.getComputedStyle(containerAfter).display);
                console.log('Container opacity:', window.getComputedStyle(containerAfter).opacity);
            }
        }, 100);
        
        console.log('=== AMBULANCE RENDER END ===');
    }

    // Render recent activity
    renderRecentActivity() {
        const activityContainer = document.getElementById('recent-activity-list');
        if (!activityContainer) return;

        const data = this.dataManager.getData();
        const recentRecords = (data.medicalRecords || [])
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5); // Show only the 5 most recent

        const recentSymptoms = (data.symptomTracking || [])
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3); // Show only the 3 most recent

        // Combine and sort all recent activity
        const allActivity = [
            ...recentRecords.map(record => ({
                type: 'medical_record',
                title: record.incidentType?.replace('_', ' ') || 'Medical Record',
                timestamp: record.timestamp,
                severity: record.severity,
                icon: '📋',
                data: record
            })),
            ...recentSymptoms.map(symptom => ({
                type: 'symptom',
                title: symptom.symptom || 'Symptom Log',
                timestamp: symptom.timestamp,
                severity: symptom.severity,
                icon: '🌡️',
                data: symptom
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .slice(0, 5); // Show only 5 most recent items total

        if (allActivity.length === 0) {
            activityContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-3">📝</div>
                    <p>No recent activity yet.</p>
                    <p class="text-sm mt-1">Start by adding your first medical record!</p>
                    <button id="add-first-record-btn" class="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Add Record
                    </button>
                </div>
            `;

            // Add event listener for the add record button
            document.getElementById('add-first-record-btn')?.addEventListener('click', () => {
                if (window.medicalRecordsManager && window.medicalRecordsManager.showAddRecordModal) {
                    window.medicalRecordsManager.showAddRecordModal();
                } else {
                    this.createEnhancedMedicalRecordsModal();
                }
            });
        } else {
            activityContainer.innerHTML = allActivity.map(activity => `
                <div class="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-300">
                    <div class="w-12 h-12 ${this.getActivityColor(activity.type)} rounded-full flex items-center justify-center">
                        <span class="text-xl">${activity.icon}</span>
                    </div>
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">${activity.title}</div>
                        <div class="text-sm text-gray-600">
                            ${activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'No date'}
                            ${activity.timestamp ? ' at ' + new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </div>
                        ${activity.data.notes ? `<div class="text-xs text-gray-500 mt-1">${activity.data.notes.substring(0, 50)}${activity.data.notes.length > 50 ? '...' : ''}</div>` : ''}
                    </div>
                    ${activity.severity ? `
                        <span class="px-2 py-1 text-xs rounded-full ${this.getSeverityColor(activity.severity)}">
                            ${activity.severity}/10
                        </span>
                    ` : ''}
                </div>
            `).join('');
        }

        // Add event listener for "View All" button
        document.getElementById('view-all-activity-btn')?.addEventListener('click', () => {
            window.location.href = '/profile.html?tab=records';
        });
    }

    // Get activity type color
    getActivityColor(type) {
        switch (type) {
            case 'medical_record': return 'bg-blue-100';
            case 'symptom': return 'bg-purple-100';
            default: return 'bg-gray-100';
        }
    }

    // Get severity color for badges
    getSeverityColor(severity) {
        const severityNum = parseInt(severity);
        if (severityNum <= 3) return 'bg-green-100 text-green-800';
        if (severityNum <= 6) return 'bg-yellow-100 text-yellow-800';
        if (severityNum <= 8) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
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
            // Also refresh the summary after any data changes
            this.updateSummaryCards();
        }
    }

    // Update authentication UI
    updateAuthUI(user) {
        const signedInView = document.getElementById('auth-signed-in-view');
        const userNameDisplay = document.getElementById('user-name-display');
        const userEmailDisplay = document.getElementById('user-email-display');
        const userAvatar = document.getElementById('user-avatar');
        const addRecordBtn = document.getElementById('add-record-btn');
        const showProfileBtn = document.getElementById('show-profile-btn');

        if (user) {
            // User is signed in
            if (signedInView) {
                signedInView.classList.remove('hidden');
                signedInView.classList.add('flex');
            }
            
            const displayName = user.displayName || user.email || (user.isAnonymous ? 'Guest User' : 'Anonymous');
            const email = user.email || (user.isAnonymous ? 'guest@healthoverview.com' : 'anonymous@healthoverview.com');
            
            if (userNameDisplay) userNameDisplay.textContent = displayName;
            if (userEmailDisplay) userEmailDisplay.textContent = email;
            
            // Handle profile picture with fallback to avatar initial
            this.updateUserProfilePicture(displayName);
            
            // Show authenticated user buttons
            if (addRecordBtn) addRecordBtn.classList.remove('hidden');
            if (showProfileBtn) showProfileBtn.classList.remove('hidden');
            
            // Update greeting and summary
            this.updateGreetingAndSummary(displayName);
            
        } else {
            // User is signed out, redirect to login page
            window.location.href = '/index.html';
        }
    }

    // Update user profile picture with fallback to avatar initial
    updateUserProfilePicture(displayName) {
        const userProfilePic = document.getElementById('user-profile-pic');
        const userAvatar = document.getElementById('user-avatar');
        
        // Get user data to check for profile picture
        const userData = this.dataManager.getData();
        const profilePictureUrl = userData?.userProfile?.profilePicture?.url || userData?.profilePicture?.url;
        
        if (profilePictureUrl && userProfilePic && userAvatar) {
            // Show profile picture if available
            userProfilePic.src = profilePictureUrl;
            userProfilePic.classList.remove('hidden');
            userAvatar.classList.add('hidden');
        } else if (userAvatar && displayName) {
            // Fall back to avatar initial if no profile picture
            const initial = displayName.charAt(0).toUpperCase();
            userAvatar.textContent = initial;
            userAvatar.classList.remove('hidden');
            if (userProfilePic) userProfilePic.classList.add('hidden');
        }
    }

    // Update greeting and summary information
    updateGreetingAndSummary(displayName) {
        const greetingElement = document.getElementById('personal-greeting');
        const summaryElement = document.getElementById('user-stats-summary');
        
        if (greetingElement) {
            const timeOfDay = this.getTimeOfDay();
            greetingElement.innerHTML = `Good ${timeOfDay}, ${displayName}! 👋`;
        }
        
        if (summaryElement) {
            const data = this.dataManager.getData();
            const hospitalCount = data.hospitals?.length || 0;
            const ambulanceCount = data.ambulance?.length || 0;
            const visitedHospitals = data.hospitals?.filter(h => h.visited)?.length || 0;
            const visitedAmbulance = data.ambulance?.filter(a => a.visited)?.length || 0;
            const medicalRecords = data.medicalRecords?.length || 0;
            
            summaryElement.textContent = `You've explored ${visitedHospitals} hospitals and ${visitedAmbulance} ambulance services, with ${medicalRecords} medical records logged.`;
        }
        
        // Update summary cards
        this.updateSummaryCards();
    }

    // Get time of day for greeting
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    // Update summary cards with current data
    updateSummaryCards() {
        const data = this.dataManager.getData();
        
        // New health tracking stats
        const conditions = data.conditions || [];
        const symptoms = data.symptoms || [];
        const medications = data.medications || [];
        const episodes = data.medicalEpisodes || [];
        
        // Update condition count
        const activeConditions = conditions.filter(c => c.status === 'active' || !c.status).length;
        const conditionsElement = document.getElementById('conditions-count');
        if (conditionsElement) conditionsElement.textContent = activeConditions;
        
        // Update medical episodes count
        const episodesElement = document.getElementById('episodes-count');
        if (episodesElement) episodesElement.textContent = episodes.length;
        
        // Medical records count
        const medicalRecords = data.medicalRecords?.length || 0;
        const recordsElement = document.getElementById('medical-records-count');
        if (recordsElement) recordsElement.textContent = medicalRecords;
        
        // Medications count
        const medicationsElement = document.getElementById('medications-count');
        if (medicationsElement) medicationsElement.textContent = medications.length;
        
        // Update condition and symptom lists
        this.updateConditionsList(conditions);
        this.updateSymptomsList(symptoms);
        this.updateMedicationsList(medications);
        
        // Legacy hospital/ambulance stats (kept for backward compatibility)
        const hospitalsVisited = data.hospitals?.filter(h => h.visited)?.length || 0;
        const hospitalsTotal = data.hospitals?.length || 0;
        if (document.getElementById('hospitals-visited-count')) {
            document.getElementById('hospitals-visited-count').textContent = hospitalsVisited;
        }
        if (document.getElementById('hospitals-total-count')) {
            document.getElementById('hospitals-total-count').textContent = `of ${hospitalsTotal} total`;
        }
        
        const ambulanceVisited = data.ambulance?.filter(a => a.visited)?.length || 0;
        const ambulanceTotal = data.ambulance?.length || 0;
        if (document.getElementById('ambulance-visited-count')) {
            document.getElementById('ambulance-visited-count').textContent = ambulanceVisited;
        }
        if (document.getElementById('ambulance-total-count')) {
            document.getElementById('ambulance-total-count').textContent = `of ${ambulanceTotal} total`;
        }
    }

    updateConditionsList(conditions) {
        const list = document.getElementById('conditions-list');
        if (!list) return;

        const activeConditions = conditions.filter(c => c.status === 'active' || !c.status);
        
        if (activeConditions.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p class="text-sm">No conditions tracked yet</p>
                    <button class="text-blue-600 hover:text-blue-700 text-sm mt-2" id="add-condition-link">
                        Add your first condition
                    </button>
                </div>
            `;
            list.querySelector('#add-condition-link')?.addEventListener('click', () => this.showAddConditionModal());
        } else {
            list.innerHTML = activeConditions.map(c => `
                <div class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-semibold text-sm text-gray-900">${c.name}</div>
                            ${c.diagnosedDate ? `<div class="text-xs text-gray-500">Since ${new Date(c.diagnosedDate).toLocaleDateString()}</div>` : ''}
                        </div>
                        <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">${c.status || 'active'}</span>
                    </div>
                </div>
            `).join('');
        }
        
        document.getElementById('conditions-showing-count').textContent = activeConditions.length;
    }

    updateSymptomsList(symptoms) {
        const list = document.getElementById('symptoms-list');
        if (!list) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSymptoms = symptoms.filter(s => new Date(s.timestamp) >= sevenDaysAgo).slice(0, 10);
        
        if (recentSymptoms.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p class="text-sm">No symptoms logged yet</p>
                    <button class="text-blue-600 hover:text-blue-700 text-sm mt-2" id="log-symptom-link">
                        Log your first symptom
                    </button>
                </div>
            `;
            list.querySelector('#log-symptom-link')?.addEventListener('click', () => this.showLogSymptomModal());
        } else {
            list.innerHTML = recentSymptoms.map(s => `
                <div class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-semibold text-sm text-gray-900">${s.name}</div>
                            <div class="text-xs text-gray-500">${new Date(s.timestamp).toLocaleDateString()}</div>
                        </div>
                        <span class="text-xs px-2 py-1 rounded ${
                            s.severity === 'severe' ? 'bg-red-100 text-red-700' :
                            s.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }">${s.severity}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateMedicationsList(medications) {
        const list = document.getElementById('medications-list');
        if (!list) return;

        if (medications.length === 0) {
            list.innerHTML = `
                <div class="text-center py-6 text-gray-500 text-sm">
                    No medications added
                </div>
            `;
        } else {
            list.innerHTML = medications.slice(0, 5).map(m => `
                <div class="p-2 bg-gray-50 rounded text-sm">
                    <div class="font-semibold text-gray-900">${m.name}</div>
                    ${m.dosage ? `<div class="text-xs text-gray-500">${m.dosage}</div>` : ''}
                </div>
            `).join('');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Authentication buttons
        const signOutBtn = document.getElementById('signout-btn');

        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }

        // New medical episode button - PROMINENT
        const newEpisodeBtn = document.getElementById('new-episode-btn');
        console.log('🚨 New Episode Button:', newEpisodeBtn ? 'FOUND' : 'NOT FOUND');
        
        if (newEpisodeBtn) {
            console.log('✅ Adding click handler to new-episode-btn');
            newEpisodeBtn.addEventListener('click', () => {
                console.log('🚨 NEW EPISODE BUTTON CLICKED!');
                this.showMedicalEpisodeModal();
            });
        } else {
            console.error('❌ Could not find new-episode-btn element!');
        }

        // New health tracking buttons
        const logSymptomBtn = document.getElementById('log-symptom-btn');
        const addConditionBtn = document.getElementById('add-condition-btn');
        const aiInsightsBtn = document.getElementById('ai-insights-btn');

        if (logSymptomBtn) {
            logSymptomBtn.addEventListener('click', () => this.showLogSymptomModal());
        }

        if (addConditionBtn) {
            addConditionBtn.addEventListener('click', () => this.showAddConditionModal());
        }

        if (aiInsightsBtn) {
            aiInsightsBtn.addEventListener('click', () => this.showAIInsights());
        }

        console.log('✅ Event listeners setup complete');

        // Feature buttons
        const addRecordBtn = document.getElementById('add-record-btn');
        const showProfileBtn = document.getElementById('show-profile-btn');
        const showStatsBtn = document.getElementById('show-stats-btn');
        const showMapBtn = document.getElementById('show-map-btn');
        const showAwardsBtn = document.getElementById('show-awards-btn');

        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => {
                // Use the enhanced medical records modal from profileApp.js
                if (window.medicalRecordsManager && window.medicalRecordsManager.showAddRecordModal) {
                    window.medicalRecordsManager.showAddRecordModal();
                } else {
                    // Import the enhanced modal system and create it
                    this.createEnhancedMedicalRecordsModal();
                }
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
                console.log('Map button clicked');
                showMapModal();
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
            hospitalSearch.addEventListener('input', () => {
                // Reset pagination when searching
                this.uiComponents.hospitalsShowing = 10;
                this.renderHospitals();
            });
        }

        if (ambulanceSearch) {
            ambulanceSearch.addEventListener('input', () => {
                // Reset pagination when searching
                this.uiComponents.ambulanceShowing = 10;
                this.renderAmbulance();
            });
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

    // Create enhanced medical records modal
    createEnhancedMedicalRecordsModal() {
        // Create a simplified version of the enhanced modal inline
        const userData = this.dataManager.getData();
        const userConditions = userData.userProfile?.conditions || userData.conditions || [];
        
        // Get hospitals and ambulance data for dropdowns
        const hospitals = userData.hospitals || [];
        const ambulanceServices = userData.ambulance || [];
        
        // Generate hospital options
        const hospitalOptions = hospitals.map(hospital => 
            `<option value="${hospital.name}">${hospital.name}${hospital.city ? ` (${hospital.city})` : ''}</option>`
        ).join('');
        
        // Generate ambulance options
        const ambulanceOptions = ambulanceServices.map(ambulance => 
            `<option value="${ambulance.name}">${ambulance.name}</option>`
        ).join('');
        
        // Generate condition-specific symptoms sections
        const conditionSymptomsHTML = userConditions.length > 0 ? `
            <!-- Condition-Specific Symptoms -->
            <div class="bg-gradient-to-r from-amber-500 to-orange-600 p-5 rounded-2xl shadow-lg">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <span class="text-2xl mr-3">🩺</span>
                    Your Tracked Conditions
                </h3>
                <div class="space-y-4">
                    ${userConditions.map(condition => `
                        <div class="bg-white bg-opacity-90 p-4 rounded-xl">
                            <h4 class="font-bold text-amber-800 mb-3 flex items-center">
                                <span class="mr-2">${this.getConditionIcon(condition)}</span>
                                ${condition}
                            </h4>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                                ${this.getConditionSymptoms(condition).map(symptom => `
                                    <label class="flex items-center space-x-2 text-sm">
                                        <input type="checkbox" name="condition_symptoms" value="${condition}_${symptom}" 
                                               class="rounded border-amber-300 text-amber-600 focus:ring-amber-500">
                                        <span class="text-amber-800">${symptom}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        const modalContent = `
            <div class="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-t-xl">
                <div class="text-center">
                    <div class="text-4xl mb-3">📋</div>
                    <h2 class="text-2xl font-bold mb-2">Add Medical Record</h2>
                    <p class="text-indigo-100">Track your health journey with detailed records</p>
                </div>
            </div>
            
            <div class="max-h-[70vh] overflow-y-auto" style="scrollbar-width: thin; scrollbar-color: #a78bfa #f1f5f9;">
                <form id="enhanced-record-form" class="p-6 space-y-6">
                    <!-- Incident Type Selection -->
                    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-200">
                        <h3 class="text-xl font-bold text-indigo-800 mb-4 flex items-center">
                            <span class="text-2xl mr-3">🏥</span>
                            What type of incident?
                        </h3>
                        <input type="hidden" id="selected-type" name="incidentType" required>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div class="incident-type-card p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all duration-300 bg-white" data-type="emergency_visit">
                                <div class="text-center">
                                    <div class="text-3xl mb-2">🚨</div>
                                    <div class="font-semibold text-indigo-800 text-sm">Emergency Visit</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all duration-300 bg-white" data-type="scheduled_appointment">
                                <div class="text-center">
                                    <div class="text-3xl mb-2">📅</div>
                                    <div class="font-semibold text-indigo-800 text-sm">Scheduled Appointment</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all duration-300 bg-white" data-type="symptom_episode">
                                <div class="text-center">
                                    <div class="text-3xl mb-2">🤒</div>
                                    <div class="font-semibold text-indigo-800 text-sm">Symptom Episode</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all duration-300 bg-white" data-type="medication_reaction">
                                <div class="text-center">
                                    <div class="text-3xl mb-2">💊</div>
                                    <div class="font-semibold text-indigo-800 text-sm">Medication Reaction</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all duration-300 bg-white" data-type="follow_up">
                                <div class="text-center">
                                    <div class="text-3xl mb-2">🔄</div>
                                    <div class="font-semibold text-indigo-800 text-sm">Follow-up Visit</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all duration-300 bg-white" data-type="test_results">
                                <div class="text-center">
                                    <div class="text-3xl mb-2">📊</div>
                                    <div class="font-semibold text-indigo-800 text-sm">Test Results</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Hospital and Ambulance Section - Initially Hidden -->
                    <div id="hospital-ambulance-section" class="bg-gradient-to-r from-cyan-500 to-blue-600 p-5 rounded-2xl shadow-lg hidden">
                        <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                            <span class="text-2xl mr-3">🏥</span>
                            Hospital & Transport Details
                        </h3>
                        <div class="space-y-4">
                            <!-- Hospital Selection -->
                            <div class="bg-white bg-opacity-90 p-4 rounded-xl">
                                <label class="block text-sm font-bold text-cyan-800 mb-2">Which hospital did you visit?</label>
                                <select name="hospital" 
                                        class="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:ring-4 focus:ring-cyan-300 focus:border-cyan-500 transition-all duration-300">
                                    <option value="">Select a hospital...</option>
                                    ${hospitalOptions}
                                </select>
                            </div>
                            
                            <!-- Ambulance Checkbox -->
                            <div class="bg-white bg-opacity-90 p-4 rounded-xl">
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" 
                                           id="ambulance-involved" 
                                           name="ambulanceInvolved"
                                           class="w-5 h-5 text-cyan-600 border-2 border-cyan-300 rounded focus:ring-cyan-500">
                                    <span class="text-sm font-bold text-cyan-800">Was an ambulance service involved?</span>
                                </label>
                            </div>
                            
                            <!-- Ambulance Selection - Initially Hidden -->
                            <div id="ambulance-selection" class="bg-white bg-opacity-90 p-4 rounded-xl hidden">
                                <label class="block text-sm font-bold text-cyan-800 mb-2">Which ambulance service was involved?</label>
                                <select name="ambulance" 
                                        class="w-full px-3 py-2 border-2 border-cyan-200 rounded-lg focus:ring-4 focus:ring-cyan-300 focus:border-cyan-500 transition-all duration-300">
                                    <option value="">Select an ambulance service...</option>
                                    ${ambulanceOptions}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Basic Info -->
                    <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg">
                        <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                            <span class="text-2xl mr-3">📍</span>
                            When and where?
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-white bg-opacity-90 p-4 rounded-xl">
                                <label class="block text-sm font-bold text-emerald-800 mb-2">Date & Time</label>
                                <input type="datetime-local" 
                                       name="datetime" 
                                       value="${new Date().toISOString().slice(0, 16)}"
                                       class="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500 transition-all duration-300"
                                       required>
                            </div>
                            <div class="bg-white bg-opacity-90 p-4 rounded-xl">
                                <label class="block text-sm font-bold text-emerald-800 mb-2">Location</label>
                                <input type="text" 
                                       name="location" 
                                       placeholder="Hospital, home, work..."
                                       class="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500 transition-all duration-300">
                            </div>
                        </div>
                    </div>

                    ${conditionSymptomsHTML}

                    <!-- Severity -->
                    <div class="bg-gradient-to-r from-rose-500 to-red-600 p-5 rounded-2xl shadow-lg">
                        <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                            <span class="text-2xl mr-3">📊</span>
                            How severe is it?
                        </h3>
                        <div class="bg-white bg-opacity-90 p-4 rounded-xl">
                            <label class="block text-sm font-bold text-rose-800 mb-3">Pain/Discomfort Level (1-10)</label>
                            <input type="range" 
                                   id="severity-slider"
                                   name="severity" 
                                   min="1" 
                                   max="10" 
                                   value="5" 
                                   class="w-full h-3 bg-gradient-to-r from-green-300 via-yellow-300 to-red-500 rounded-lg appearance-none cursor-pointer">
                            <div class="flex justify-between text-xs text-rose-600 mt-2 font-medium">
                                <span>1 - Minimal</span>
                                <span id="severity-label" class="font-bold">5 - Moderate</span>
                                <span>10 - Severe</span>
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                    <div class="bg-gradient-to-r from-slate-500 to-gray-600 p-5 rounded-2xl shadow-lg">
                        <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                            <span class="text-2xl mr-3">📝</span>
                            Additional details
                        </h3>
                        <div class="bg-white bg-opacity-90 p-4 rounded-xl">
                            <textarea name="notes" 
                                      rows="4" 
                                      placeholder="Describe what happened, triggers, treatments used, how you felt..."
                                      class="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-gray-300 focus:border-gray-500 transition-all duration-300 resize-none"></textarea>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-between items-center pt-6 border-t-2 border-gray-200">
                        <button type="button" 
                                id="cancel-enhanced-record-btn"
                                class="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 font-medium border-2 border-gray-300 rounded-xl hover:border-gray-400 transition-all duration-300 transform hover:scale-105">
                            <span class="mr-2">❌</span>
                            Cancel
                        </button>
                        <button type="submit" 
                                class="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold shadow-lg transform hover:scale-105 hover:shadow-xl">
                            <span class="mr-2">💾</span>
                            Save Medical Record
                            <span class="ml-2 animate-pulse">✨</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Import and show the modal
        import('./components/modal.js').then(({ showModal, hideModal }) => {
            showModal(modalContent, false);
            
            // Set up event listeners
            this.setupEnhancedRecordFormListeners();
        });
    }

    // Setup event listeners for the enhanced record form
    setupEnhancedRecordFormListeners() {
        // Severity slider
        const severitySlider = document.getElementById('severity-slider');
        if (severitySlider) {
            severitySlider.addEventListener('input', (e) => {
                const value = e.target.value;
                const labels = {
                    1: '1 - Minimal', 2: '2 - Mild', 3: '3 - Mild', 4: '4 - Moderate', 5: '5 - Moderate',
                    6: '6 - Moderate', 7: '7 - Severe', 8: '8 - Severe', 9: '9 - Very Severe', 10: '10 - Unbearable'
                };
                const label = document.getElementById('severity-label');
                if (label) label.textContent = labels[value] || value;
            });
        }

        // Incident type selection
        const incidentCards = document.querySelectorAll('.incident-type-card');
        const selectedTypeInput = document.getElementById('selected-type');
        const hospitalAmbulanceSection = document.getElementById('hospital-ambulance-section');

        // Define which incident types require hospital/ambulance selection
        const hospitalVisitTypes = ['emergency_visit', 'scheduled_appointment', 'follow_up'];

        incidentCards.forEach(card => {
            card.addEventListener('click', () => {
                incidentCards.forEach(c => c.classList.remove('border-indigo-500', 'bg-indigo-50'));
                card.classList.add('border-indigo-500', 'bg-indigo-50');
                selectedTypeInput.value = card.dataset.type;
                
                // Show/hide hospital and ambulance section based on incident type
                if (hospitalVisitTypes.includes(card.dataset.type)) {
                    hospitalAmbulanceSection.classList.remove('hidden');
                } else {
                    hospitalAmbulanceSection.classList.add('hidden');
                }
            });
        });

        // Ambulance involvement checkbox
        const ambulanceInvolved = document.getElementById('ambulance-involved');
        const ambulanceSelection = document.getElementById('ambulance-selection');

        if (ambulanceInvolved && ambulanceSelection) {
            ambulanceInvolved.addEventListener('change', (e) => {
                if (e.target.checked) {
                    ambulanceSelection.classList.remove('hidden');
                } else {
                    ambulanceSelection.classList.add('hidden');
                    // Clear the ambulance selection when hiding
                    const ambulanceSelect = ambulanceSelection.querySelector('select[name="ambulance"]');
                    if (ambulanceSelect) ambulanceSelect.value = '';
                }
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-enhanced-record-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                import('./components/modal.js').then(({ hideModal }) => {
                    hideModal();
                });
            });
        }

        // Form submission
        const form = document.getElementById('enhanced-record-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEnhancedRecordSubmit(e);
            });
        }
    }

    // Handle enhanced record form submission
    handleEnhancedRecordSubmit(e) {
        const formData = new FormData(e.target);
        
        // Collect condition symptoms
        const conditionSymptoms = [];
        const conditionSymptomsInputs = document.querySelectorAll('input[name="condition_symptoms"]:checked');
        conditionSymptomsInputs.forEach(input => {
            conditionSymptoms.push(input.value);
        });
        
        const recordData = {
            id: Date.now().toString(),
            incidentType: formData.get('incidentType'),
            timestamp: formData.get('datetime'),
            location: formData.get('location'),
            severity: parseInt(formData.get('severity')),
            notes: formData.get('notes'),
            conditionSymptoms: conditionSymptoms,
            createdAt: new Date().toISOString()
        };
        
        // Add hospital data if provided
        const hospitalName = formData.get('hospital');
        if (hospitalName && hospitalName.trim()) {
            recordData.hospital = hospitalName.trim();
        }
        
        // Add ambulance data if provided
        const ambulanceInvolved = formData.get('ambulanceInvolved');
        const ambulanceName = formData.get('ambulance');
        if (ambulanceInvolved && ambulanceName && ambulanceName.trim()) {
            recordData.ambulance = ambulanceName.trim();
        }
        
        // Validate required fields
        if (!recordData.incidentType) {
            import('./utils/ui.js').then(({ showStatusMessage }) => {
                showStatusMessage('Please select an incident type.', 'error');
            });
            return;
        }
        
        // For hospital visit types, require hospital selection
        const hospitalVisitTypes = ['emergency_visit', 'scheduled_appointment', 'follow_up'];
        if (hospitalVisitTypes.includes(recordData.incidentType) && !recordData.hospital) {
            import('./utils/ui.js').then(({ showStatusMessage }) => {
                showStatusMessage('Please select a hospital for this type of visit.', 'error');
            });
            return;
        }
        
        // If ambulance is checked but no service selected, show error
        if (ambulanceInvolved && (!ambulanceName || !ambulanceName.trim())) {
            import('./utils/ui.js').then(({ showStatusMessage }) => {
                showStatusMessage('Please select an ambulance service if one was involved.', 'error');
            });
            return;
        }
        
        // Save the record
        this.dataManager.addMedicalRecord(recordData);
        
        // Hide modal
        import('./components/modal.js').then(({ hideModal }) => {
            hideModal();
        });
        
        // Show success message with details
        let successMessage = 'Medical record saved successfully!';
        if (recordData.hospital) {
            successMessage += ` Hospital visit to ${recordData.hospital} has been added to your records.`;
        }
        if (recordData.ambulance) {
            successMessage += ` Ambulance service ${recordData.ambulance} has been added to your records.`;
        }
        
        import('./utils/ui.js').then(({ showStatusMessage }) => {
            showStatusMessage(successMessage, 'success');
        });
        
        // Refresh display
        this.renderAll();
    }

    // Helper method to get condition icon
    getConditionIcon(condition) {
        const icons = {
            'asthma': '🫁',
            'diabetes': '🩸',
            'hypertension': '❤️',
            'migraine': '🧠',
            'arthritis': '🦴',
            'anxiety': '😰',
            'depression': '😔',
            'heart_disease': '💓',
            'chronic_pain': '⚡',
            'allergies': '🤧',
            'ibs': '🍽️',
            'epilepsy': '⚡',
            'fibromyalgia': '🔥',
            'copd': '🫁'
        };
        return icons[condition.toLowerCase().replace(' ', '_')] || '🩺';
    }

    // Helper method to get condition-specific symptoms
    getConditionSymptoms(condition) {
        const symptoms = {
            'asthma': ['Wheezing', 'Shortness of breath', 'Chest tightness', 'Coughing', 'Difficulty breathing'],
            'diabetes': ['High blood sugar', 'Excessive thirst', 'Frequent urination', 'Fatigue', 'Blurred vision'],
            'hypertension': ['Headaches', 'Dizziness', 'Chest pain', 'Shortness of breath', 'Nosebleeds'],
            'migraine': ['Severe headache', 'Nausea', 'Light sensitivity', 'Sound sensitivity', 'Aura'],
            'arthritis': ['Joint pain', 'Stiffness', 'Swelling', 'Reduced range of motion', 'Warmth'],
            'anxiety': ['Rapid heartbeat', 'Sweating', 'Trembling', 'Restlessness', 'Worry'],
            'depression': ['Sadness', 'Loss of interest', 'Fatigue', 'Sleep changes', 'Appetite changes'],
            'heart_disease': ['Chest pain', 'Shortness of breath', 'Fatigue', 'Irregular heartbeat', 'Swelling'],
            'chronic_pain': ['Persistent pain', 'Fatigue', 'Sleep disturbance', 'Mood changes', 'Limited mobility'],
            'allergies': ['Sneezing', 'Runny nose', 'Itchy eyes', 'Skin rash', 'Congestion'],
            'ibs': ['Abdominal pain', 'Bloating', 'Diarrhea', 'Constipation', 'Gas'],
            'epilepsy': ['Seizures', 'Confusion', 'Memory loss', 'Fatigue', 'Mood changes'],
            'fibromyalgia': ['Widespread pain', 'Fatigue', 'Sleep problems', 'Cognitive issues', 'Tender points'],
            'copd': ['Shortness of breath', 'Chronic cough', 'Mucus production', 'Wheezing', 'Chest tightness']
        };
        return symptoms[condition.toLowerCase().replace(' ', '_')] || ['Pain', 'Discomfort', 'Fatigue', 'Other symptoms'];
    }

    // Add entrance animations method
    animateElementsEntrance() {
        // Animate summary cards
        const summaryCards = document.querySelectorAll('.summary-card-1, .summary-card-2, .summary-card-3, .summary-card-4');
        summaryCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px) scale(0.9)';
            card.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, index * 150);
        });

        // Animate main content cards
        const mainCards = document.querySelectorAll('.glass-card');
        mainCards.forEach((card, index) => {
            // Skip summary cards as they're animated separately
            if (!card.closest('.summary-card-1, .summary-card-2, .summary-card-3, .summary-card-4')) {
                card.style.opacity = '0';
                card.style.transform = 'translateY(40px)';
                card.style.transition = 'all 0.8s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 400 + (index * 200));
            }
        });

        // Animate action buttons
        const actionButtons = document.querySelectorAll('#add-record-btn, #show-profile-btn, #show-stats-btn, #show-map-btn, #show-awards-btn');
        actionButtons.forEach((button, index) => {
            if (button) {
                button.style.opacity = '0';
                button.style.transform = 'scale(0.8) translateY(20px)';
                button.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    button.style.opacity = '1';
                    button.style.transform = 'scale(1) translateY(0)';
                }, 800 + (index * 100));
            }
        });

        // Animate welcome section
        const welcomeSection = document.querySelector('.slide-up');
        if (welcomeSection) {
            welcomeSection.style.animationDelay = '0.2s';
        }
    }

    // ===== HEALTH TRACKING METHODS =====
    
    showLogSymptomModal() {
        const modal = this.createModal('Log Symptom', this.generateSymptomForm());
        
        const form = modal.querySelector('#symptom-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveSymptom(form);
                this.closeModal(modal);
            });
        }
    }

    showAddConditionModal() {
        const modal = this.createModal('Add Condition', this.generateConditionForm());
        
        const form = modal.querySelector('#condition-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveCondition(form);
                this.closeModal(modal);
            });
        }
    }

    async showAIInsights() {
        if (!this.healthAI.isEnabled()) {
            const enable = confirm('AI Analysis is currently disabled. Would you like to enable it?');
            if (enable) {
                this.healthAI.updateSettings({ enabled: true });
                showStatusMessage('AI Analysis enabled! 🤖', 'success');
            } else {
                return;
            }
        }

        showStatusMessage('Analyzing your health data... 🤖', 'info');

        try {
            const userData = this.dataManager.localData;
            const symptoms = userData.symptoms || [];
            const conditions = userData.conditions || [];
            const medications = userData.medications || [];

            // Run AI analyses
            const [symptomAnalysis, conditionTrends, medicationCheck, insights] = await Promise.all([
                this.healthAI.analyzeSymptoms(symptoms, conditions),
                this.healthAI.analyzeConditionTrends(conditions),
                this.healthAI.getMedicationInteractions(medications),
                this.healthAI.getHealthInsights(userData)
            ]);

            // Display results
            this.displayAIResults(symptomAnalysis, conditionTrends, medicationCheck, insights);
        } catch (error) {
            console.error('AI analysis error:', error);
            showStatusMessage('Failed to analyze health data', 'error');
        }
    }

    displayAIResults(symptomAnalysis, conditionTrends, medicationCheck, insights) {
        const panel = document.getElementById('ai-analysis-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="space-y-3">
                ${symptomAnalysis.severity !== 'none' ? `
                    <div class="p-3 bg-${symptomAnalysis.urgency === 'urgent' ? 'red' : 'yellow'}-50 rounded-lg">
                        <div class="font-semibold text-sm mb-1">Symptom Analysis</div>
                        <div class="text-xs text-gray-600">
                            Severity: <span class="font-medium">${symptomAnalysis.severity}</span><br>
                            Urgency: <span class="font-medium">${symptomAnalysis.urgency}</span>
                        </div>
                    </div>
                ` : ''}
                
                ${conditionTrends.trends.length > 0 ? `
                    <div class="p-3 bg-blue-50 rounded-lg">
                        <div class="font-semibold text-sm mb-1">Condition Trends</div>
                        <div class="text-xs text-gray-600">${conditionTrends.trends[0].trend}</div>
                    </div>
                ` : ''}
                
                ${medicationCheck.interactions.length > 0 ? `
                    <div class="p-3 bg-orange-50 rounded-lg">
                        <div class="font-semibold text-sm mb-1">⚠️ Medication Alert</div>
                        <div class="text-xs text-gray-600">${medicationCheck.interactions.length} potential interactions found</div>
                    </div>
                ` : ''}
                
                <div class="p-3 bg-green-50 rounded-lg">
                    <div class="font-semibold text-sm mb-1">Health Score</div>
                    <div class="text-2xl font-bold text-green-600">${insights.score}%</div>
                </div>
                
                <div class="text-xs text-gray-500 italic">${symptomAnalysis.disclaimer || 'AI analysis for informational purposes only'}</div>
            </div>
        `;

        showStatusMessage('AI analysis complete! 🤖', 'success');
    }

    async saveSymptom(form) {
        const formData = new FormData(form);
        const symptom = {
            id: Date.now().toString(),
            name: formData.get('symptom-name'),
            severity: formData.get('severity'),
            duration: formData.get('duration'),
            notes: formData.get('notes'),
            timestamp: new Date().toISOString()
        };

        const userData = this.dataManager.localData;
        if (!userData.symptoms) userData.symptoms = [];
        userData.symptoms.push(symptom);

        await this.dataManager.saveData();
        showStatusMessage('Symptom logged successfully! 📊', 'success');
        this.refreshDashboard();
    }

    async saveCondition(form) {
        const formData = new FormData(form);
        const condition = {
            id: Date.now().toString(),
            name: formData.get('condition-name'),
            diagnosedDate: formData.get('diagnosed-date'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            timestamp: new Date().toISOString()
        };

        const userData = this.dataManager.localData;
        if (!userData.conditions) userData.conditions = [];
        userData.conditions.push(condition);

        await this.dataManager.saveData();
        showStatusMessage('Condition added successfully! 🩺', 'success');
        this.refreshDashboard();
    }

    generateSymptomForm() {
        return `
            <form id="symptom-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Symptom</label>
                    <input type="text" name="symptom-name" required
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                           placeholder="e.g., Headache, Fatigue">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <select name="severity" required
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input type="text" name="duration" required
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                           placeholder="e.g., 2 hours, 3 days">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="3"
                              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Additional details..."></textarea>
                </div>
                <button type="submit"
                        class="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Log Symptom
                </button>
            </form>
        `;
    }

    generateConditionForm() {
        return `
            <form id="condition-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Condition Name</label>
                    <input type="text" name="condition-name" required
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                           placeholder="e.g., Hypertension, Diabetes">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Diagnosed Date</label>
                    <input type="date" name="diagnosed-date"
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" required
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="active">Active</option>
                        <option value="managed">Managed</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" rows="3"
                              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Treatment plan, medications, etc."></textarea>
                </div>
                <button type="submit"
                        class="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                    Add Condition
                </button>
            </form>
        `;
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-900">${title}</h3>
                    <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                ${content}
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => this.closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });

        document.body.appendChild(modal);
        return modal;
    }

    closeModal(modal) {
        modal.remove();
    }

    // ===== MEDICAL EPISODE METHODS =====

    showMedicalEpisodeModal() {
        console.log('🚨 showMedicalEpisodeModal() called');
        console.log('📋 MEDICAL_ISSUES:', MEDICAL_ISSUES);
        
        const categoriesHTML = Object.entries(MEDICAL_ISSUES).map(([key, category]) => `
            <div class="mb-6">
                <h4 class="font-bold text-lg mb-3 flex items-center text-gray-800">
                    <span class="text-2xl mr-2">${category.icon}</span>
                    ${category.name}
                </h4>
                <div class="grid grid-cols-1 gap-2">
                    ${category.issues.map(issue => `
                        <button type="button" 
                                class="episode-issue-btn text-left p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                                data-issue-id="${issue.id}"
                                data-category="${key}">
                            <div class="flex justify-between items-center">
                                <div>
                                    <div class="font-semibold text-gray-900">${issue.name}</div>
                                    <div class="text-xs text-gray-500 mt-1">
                                        ${issue.requiresAmbulance ? '🚑 ' : ''}
                                        ${issue.requiresHospital ? '🏥 ' : ''}
                                        Severity: <span class="font-medium ${
                                            issue.severity === 'critical' ? 'text-red-600' :
                                            issue.severity === 'high' ? 'text-orange-600' :
                                            issue.severity === 'medium' ? 'text-yellow-600' :
                                            'text-green-600'
                                        }">${issue.severity}</span>
                                    </div>
                                </div>
                                <div class="text-2xl">→</div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');

        const modalContent = `
            <div class="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <p class="text-gray-600 mb-4">Select the type of medical episode or emergency you experienced:</p>
                ${categoriesHTML}
            </div>
        `;

        const modal = this.createModal('🚨 New Medical Episode', modalContent);
        
        // Add click handlers to all issue buttons
        modal.querySelectorAll('.episode-issue-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const issueId = btn.dataset.issueId;
                const category = btn.dataset.category;
                this.closeModal(modal);
                this.showEpisodeDetailsModal(issueId, category);
            });
        });
    }

    showEpisodeDetailsModal(issueId, categoryKey) {
        const category = MEDICAL_ISSUES[categoryKey];
        const issue = category.issues.find(i => i.id === issueId);

        if (!issue) return;

        // Get user's predefined locations or defaults
        const userLocations = this.dataManager.localData?.userSettings?.locations || ['Home', 'Work', 'Outside', 'Other'];
        const ambulanceServices = this.dataManager.localData?.ambulance?.map(a => a.name) || [];
        const hospitals = this.dataManager.localData?.hospitals?.map(h => h.name) || [];

        const modalContent = `
            <form id="episode-form" class="space-y-4">
                <div class="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-4 text-white mb-4 shadow-lg">
                    <div class="text-lg font-bold">${issue.name}</div>
                    <div class="text-sm opacity-90">Category: ${category.name}</div>
                    <div class="text-sm opacity-90 mt-1">
                        Severity: <span class="font-bold">${issue.severity.toUpperCase()}</span>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">When did this occur?</label>
                    <input type="datetime-local" name="episode-time" required
                           value="${new Date().toISOString().slice(0, 16)}"
                           class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">📍 Location</label>
                    <select name="episode-location" required
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select location...</option>
                        ${userLocations.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                    </select>
                </div>

                ${issue.requiresAmbulance ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <label class="flex items-center space-x-2 mb-2">
                            <input type="checkbox" name="ambulance-called" id="ambulance-called" class="rounded">
                            <span class="text-sm font-medium text-gray-700">🚑 Ambulance was called</span>
                        </label>
                        <div id="ambulance-details" class="hidden space-y-2 mt-2">
                            <div class="relative">
                                <input type="text" name="ambulance-service" id="ambulance-input" placeholder="Start typing ambulance service..."
                                       class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 autocomplete-input"
                                       list="ambulance-list">
                                <datalist id="ambulance-list">
                                    ${ambulanceServices.map(s => `<option value="${s}">`).join('')}
                                </datalist>
                                <div id="ambulance-suggestions" class="hidden absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto"></div>
                            </div>
                            <input type="time" name="ambulance-arrival" placeholder="Arrival time"
                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                ` : ''}

                ${issue.requiresHospital ? `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                        <label class="flex items-center space-x-2 mb-2">
                            <input type="checkbox" name="hospital-visit" id="hospital-visit" class="rounded">
                            <span class="text-sm font-medium text-gray-700">🏥 Went to hospital</span>
                        </label>
                        <div id="hospital-details" class="hidden space-y-2 mt-2">
                            <div class="relative">
                                <input type="text" name="hospital-name" id="hospital-input" placeholder="Start typing hospital name..."
                                       class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 autocomplete-input"
                                       list="hospital-list">
                                <datalist id="hospital-list">
                                    ${hospitals.map(h => `<option value="${h}">`).join('')}
                                </datalist>
                                <div id="hospital-suggestions" class="hidden absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto"></div>
                            </div>
                            <input type="time" name="hospital-arrival" placeholder="Arrival time"
                                   class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                            <select name="treatment-type" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Treatment received</option>
                                <option value="emergency">Emergency Department</option>
                                <option value="admission">Hospital Admission</option>
                                <option value="observation">Observation</option>
                                <option value="outpatient">Outpatient</option>
                            </select>
                        </div>
                    </div>
                ` : ''}

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea name="notes" rows="4"
                              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Describe what happened, symptoms, treatment received, etc."></textarea>
                </div>

                <div class="flex space-x-3">
                    <button type="submit"
                            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-500 transition transform hover:scale-105 shadow-lg">
                        💾 Save Episode
                    </button>
                    <button type="button" class="cancel-btn px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">
                        Cancel
                    </button>
                </div>
            </form>
        `;

        const modal = this.createModal(`Record: ${issue.name}`, modalContent);

        // Setup autocomplete for ambulance service
        const ambulanceInput = modal.querySelector('#ambulance-input');
        if (ambulanceInput) {
            ambulanceInput.addEventListener('input', (e) => {
                const value = e.target.value.toLowerCase();
                const suggestions = document.querySelector('#ambulance-suggestions');
                if (!suggestions) return;
                
                if (value.length < 1) {
                    suggestions.classList.add('hidden');
                    return;
                }
                
                const filtered = ambulanceServices.filter(s => s.toLowerCase().includes(value));
                if (filtered.length > 0) {
                    suggestions.innerHTML = filtered.map(s => `
                        <div class="p-2 cursor-pointer hover:bg-blue-100 text-sm">${s}</div>
                    `).join('');
                    suggestions.classList.remove('hidden');
                    
                    suggestions.querySelectorAll('div').forEach(div => {
                        div.addEventListener('click', () => {
                            ambulanceInput.value = div.textContent.trim();
                            suggestions.classList.add('hidden');
                        });
                    });
                } else {
                    suggestions.classList.add('hidden');
                }
            });
        }

        // Setup autocomplete for hospital
        const hospitalInput = modal.querySelector('#hospital-input');
        if (hospitalInput) {
            hospitalInput.addEventListener('input', (e) => {
                const value = e.target.value.toLowerCase();
                const suggestions = document.querySelector('#hospital-suggestions');
                if (!suggestions) return;
                
                if (value.length < 1) {
                    suggestions.classList.add('hidden');
                    return;
                }
                
                const filtered = hospitals.filter(h => h.toLowerCase().includes(value));
                if (filtered.length > 0) {
                    suggestions.innerHTML = filtered.map(h => `
                        <div class="p-2 cursor-pointer hover:bg-green-100 text-sm">${h}</div>
                    `).join('');
                    suggestions.classList.remove('hidden');
                    
                    suggestions.querySelectorAll('div').forEach(div => {
                        div.addEventListener('click', () => {
                            hospitalInput.value = div.textContent.trim();
                            suggestions.classList.add('hidden');
                        });
                    });
                } else {
                    suggestions.classList.add('hidden');
                }
            });
        }

        // Toggle ambulance details
        const ambulanceCalled = modal.querySelector('#ambulance-called');
        if (ambulanceCalled) {
            ambulanceCalled.addEventListener('change', (e) => {
                const details = modal.querySelector('#ambulance-details');
                if (details) {
                    details.classList.toggle('hidden', !e.target.checked);
                }
            });
        }

        // Toggle hospital details
        const hospitalVisit = modal.querySelector('#hospital-visit');
        if (hospitalVisit) {
            hospitalVisit.addEventListener('change', (e) => {
                const details = modal.querySelector('#hospital-details');
                if (details) {
                    details.classList.toggle('hidden', !e.target.checked);
                }
            });
        }

        // Form submission
        const form = modal.querySelector('#episode-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveEpisode(form, issueId, categoryKey);
            this.closeModal(modal);
        });

        // Cancel button
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeModal(modal);
        });
    }

    async saveEpisode(form, issueId, categoryKey) {
        const formData = new FormData(form);
        const episode = this.episodeManager.createEpisode(issueId, categoryKey);

        if (!episode) {
            showStatusMessage('Error creating episode', 'error');
            return;
        }

        // Add form data to episode
        episode.timestamp = formData.get('episode-time') || new Date().toISOString();
        episode.notes = formData.get('notes') || '';
        episode.location = formData.get('episode-location') || 'Not specified';

        // Handle ambulance progression
        if (formData.get('ambulance-called')) {
            const serviceName = formData.get('ambulance-service');
            const arrivalTime = formData.get('ambulance-arrival');
            
            await this.episodeManager.addProgression(episode.id, 'ambulance_called', {
                serviceName,
                arrivalTime,
                timestamp: episode.timestamp
            });

            if (serviceName) {
                await this.episodeManager.markAmbulanceService(serviceName);
            }
        }

        // Handle hospital progression
        if (formData.get('hospital-visit')) {
            const hospitalName = formData.get('hospital-name');
            const arrivalTime = formData.get('hospital-arrival');
            const treatmentType = formData.get('treatment-type');
            
            await this.episodeManager.addProgression(episode.id, 'hospital_arrival', {
                hospitalName,
                arrivalTime,
                treatmentType,
                timestamp: episode.timestamp
            });

            if (hospitalName) {
                await this.episodeManager.markHospitalVisit(hospitalName);
            }
        }

        // Save the episode
        await this.episodeManager.saveEpisode(episode);

        showStatusMessage(`Medical episode recorded: ${episode.issueName} 🚨`, 'success');
        
        // Navigate to episode detail page
        setTimeout(() => {
            window.location.href = `/episode-detail.html?id=${episode.id}`;
        }, 800);
    }

    // Show progression timeline for editing episode flow
    showEpisodeProgressionTimeline(episodeId) {
        const data = this.dataManager.getData();
        const episode = data.medicalEpisodes?.find(e => e.id === episodeId);

        if (!episode) {
            showStatusMessage('Episode not found', 'error');
            return;
        }

        const progressionOptions = [
            { type: 'initial', label: '🚨 Initial Symptom', icon: '🚨' },
            { type: 'ambulance_called', label: '🚑 Ambulance Called', icon: '🚑' },
            { type: 'hospital_arrival', label: '🏥 Hospital Arrival', icon: '🏥' },
            { type: 'treatment_started', label: '💊 Treatment Started', icon: '💊' },
            { type: 'escalation', label: '⚠️ Condition Escalated', icon: '⚠️' },
            { type: 'observation', label: '👁️ Under Observation', icon: '👁️' },
            { type: 'recovery', label: '✅ Recovery Stage', icon: '✅' },
            { type: 'discharge', label: '🏠 Discharged', icon: '🏠' }
        ];

        // Build timeline HTML
        const timelineHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <div class="font-semibold text-gray-900">${episode.issueName}</div>
                    <div class="text-sm text-gray-600 mt-1">
                        Started: ${new Date(episode.timestamp).toLocaleString()}
                    </div>
                    <div class="text-sm text-gray-600">Location: ${episode.location || 'Not specified'}</div>
                </div>

                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700 mb-3">Progression Timeline:</label>
                    <div id="progression-items" class="space-y-2 max-h-60 overflow-y-auto">
                        ${(episode.progression || []).map((prog, idx) => `
                            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">${progressionOptions.find(o => o.type === prog.type)?.label || prog.type}</div>
                                    <div class="text-xs text-gray-500">${new Date(prog.timestamp).toLocaleString()}</div>
                                    ${prog.serviceName ? `<div class="text-xs text-gray-600 mt-1">Service: ${prog.serviceName}</div>` : ''}
                                    ${prog.hospitalName ? `<div class="text-xs text-gray-600 mt-1">Hospital: ${prog.hospitalName}</div>` : ''}
                                </div>
                                <button type="button" class="remove-progression-btn ml-2 text-red-500 hover:text-red-700 font-bold" data-index="${idx}">
                                    ✕
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                    <div class="text-sm font-medium text-gray-900 mb-2">Add New Progression:</div>
                    <select id="new-progression-type" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 mb-2">
                        <option value="">Select progression type...</option>
                        ${progressionOptions.map(opt => `<option value="${opt.type}">${opt.label}</option>`).join('')}
                    </select>
                    <textarea id="progression-notes" placeholder="Notes about this progression (optional)" rows="2"
                              class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                    <button type="button" id="add-progression-btn" class="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-500 transition">
                        + Add to Timeline
                    </button>
                </div>

                <div class="flex space-x-2">
                    <button type="button" class="flex-1 bg-gradient-to-r from-green-600 to-green-400 text-white font-bold py-2 px-4 rounded-lg hover:from-green-700 hover:to-green-500 transition" id="save-progression-btn">
                        ✅ Save Changes
                    </button>
                    <button type="button" class="flex-1 bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-400 transition close-progression-modal">
                        Close
                    </button>
                </div>
            </div>
        `;

        const modal = this.createModal(`📋 Episode Timeline: ${episode.issueName}`, timelineHTML);

        // Add progression button
        const addBtn = modal.querySelector('#add-progression-btn');
        addBtn.addEventListener('click', () => {
            const typeSelect = modal.querySelector('#new-progression-type');
            const notesText = modal.querySelector('#progression-notes');
            const type = typeSelect.value;

            if (!type) {
                showStatusMessage('Please select a progression type', 'error');
                return;
            }

            // Add to visual list
            const itemsContainer = modal.querySelector('#progression-items');
            const newProgItem = document.createElement('div');
            newProgItem.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200';
            const label = progressionOptions.find(o => o.type === type)?.label || type;
            const timestamp = new Date().toLocaleString();
            newProgItem.innerHTML = `
                <div class="flex-1">
                    <div class="font-medium text-gray-900">${label}</div>
                    <div class="text-xs text-gray-500">${timestamp}</div>
                    ${notesText.value ? `<div class="text-xs text-gray-600 mt-1">${notesText.value}</div>` : ''}
                </div>
                <button type="button" class="remove-progression-btn ml-2 text-red-500 hover:text-red-700 font-bold">
                    ✕
                </button>
            `;

            // Add remove handler
            newProgItem.querySelector('.remove-progression-btn').addEventListener('click', () => {
                newProgItem.remove();
            });

            itemsContainer.appendChild(newProgItem);

            // Reset inputs
            typeSelect.value = '';
            notesText.value = '';
            showStatusMessage(`${label} added to timeline`, 'success');
        });

        // Remove progression buttons
        modal.querySelectorAll('.remove-progression-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const progItem = e.target.closest('div.bg-gray-50');
                if (progItem) {
                    progItem.remove();
                }
            });
        });

        // Save changes
        const saveBtn = modal.querySelector('#save-progression-btn');
        saveBtn.addEventListener('click', async () => {
            // Collect all progressions from the UI
            const progressionItems = modal.querySelectorAll('#progression-items .bg-gray-50');
            const newProgressions = [];

            progressionItems.forEach(item => {
                const label = item.querySelector('.font-medium').textContent;
                const type = progressionOptions.find(o => o.label === label)?.type;
                newProgressions.push({
                    type: type || 'other',
                    timestamp: new Date().toISOString(),
                    notes: item.querySelector('.text-xs:last-child')?.textContent || ''
                });
            });

            // Update episode in data manager
            episode.progression = newProgressions;
            await this.dataManager.saveData();

            showStatusMessage('Episode timeline updated! 📋', 'success');
            this.closeModal(modal);
            this.refreshDashboard();
        });

        // Close button
        modal.querySelector('.close-progression-modal').addEventListener('click', () => {
            this.closeModal(modal);
        });
    }
}

// UI Components class to handle rendering
class UIComponents {
    constructor() {
        this.hospitalsShowing = 10;
        this.ambulanceShowing = 10;
    }

    renderList(type, data, searchTerm = '', originalData = null) {
        const containerId = type === 'hospitals' ? 'hospitals-list' : 'ambulance-list';
        const container = document.getElementById(containerId);
        const showingCountId = type === 'hospitals' ? 'hospitals-showing-count' : 'ambulance-showing-count';
        const loadMoreId = type === 'hospitals' ? 'hospitals-load-more' : 'ambulance-load-more';
        
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        const showingLimit = type === 'hospitals' ? this.hospitalsShowing : this.ambulanceShowing;
        const dataToShow = data.slice(0, showingLimit);
        const hasMore = data.length > showingLimit;

        container.innerHTML = '';

        // Update showing count
        const showingCountEl = document.getElementById(showingCountId);
        if (showingCountEl) {
            showingCountEl.textContent = dataToShow.length;
        }

        // Show/hide load more button
        const loadMoreEl = document.getElementById(loadMoreId);
        if (loadMoreEl) {
            if (hasMore) {
                loadMoreEl.classList.remove('hidden');
                const button = loadMoreEl.querySelector('button');
                if (button) {
                    button.textContent = `Load more ${type} (${data.length - showingLimit} remaining)...`;
                    button.onclick = () => {
                        if (type === 'hospitals') {
                            this.hospitalsShowing += 10;
                        } else {
                            this.ambulanceShowing += 10;
                        }
                        this.renderList(type, data, searchTerm, originalData);
                    };
                }
            } else {
                loadMoreEl.classList.add('hidden');
            }
        }

        if (!dataToShow || dataToShow.length === 0) {
            container.innerHTML = `
                <div class="text-gray-500 text-center py-12">
                    <div class="text-4xl mb-4">${type === 'hospitals' ? '🏥' : '🚑'}</div>
                    <p class="text-lg">No ${type} found${searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                </div>
            `;
            return;
        }

        dataToShow.forEach((item, filteredIndex) => {
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
        listItem.className = 'list-item glass-card rounded-2xl p-5 mb-4 transition-all duration-300 hover:shadow-xl border border-white/30';
        
        const isVisited = item.visited || false;
        const count = item.count || 0;
        
        // Generate gradient based on type
        const gradientClass = type === 'hospitals' 
            ? 'from-purple-50 to-blue-50 border-purple-200' 
            : 'from-blue-50 to-cyan-50 border-blue-200';
        
        listItem.className += ` bg-gradient-to-br ${gradientClass}`;
        
        listItem.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4 flex-1">
                    <div class="flex-shrink-0 mt-2">
                        <input 
                            type="checkbox" 
                            ${isVisited ? 'checked' : ''} 
                            data-type="${type}" 
                            data-index="${index}" 
                            class="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded-lg focus:ring-purple-500 transition-all duration-200"
                        >
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-semibold ${isVisited ? 'text-green-700' : 'text-gray-800'} mb-1">
                            ${item.name || 'Unnamed Location'}
                        </h4>
                        ${item.city ? `<p class="text-sm text-gray-600 mb-2 flex items-center">
                            <span class="mr-2">📍</span>${item.city}
                        </p>` : ''}
                        ${count > 0 ? `<div class="flex items-center space-x-2">
                            <span class="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                                ${count} visit${count > 1 ? 's' : ''}
                            </span>
                        </div>` : ''}
                    </div>
                </div>
                <div class="flex-shrink-0 ml-4">
                    <div class="flex items-center space-x-2">
                        <button 
                            data-type="${type}" 
                            data-index="${index}" 
                            data-action="increase"
                            class="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl w-10 h-10 flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg transform hover:scale-110 font-bold"
                            title="Add visit"
                        >
                            +
                        </button>
                        ${count > 0 ? `
                        <button 
                            data-type="${type}" 
                            data-index="${index}" 
                            data-action="decrease"
                            class="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl w-10 h-10 flex items-center justify-center hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg transform hover:scale-110 font-bold"
                            title="Remove visit"
                        >
                            −
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
        
        const gradientClass = type === 'hospitals' 
            ? 'from-purple-500 to-blue-600' 
            : 'from-blue-500 to-cyan-600';
        
        statsElement.innerHTML = `
            <div class="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border-2 border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-gray-700">Progress</span>
                    <span class="text-lg font-bold text-gray-800">${visited}/${total}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div class="bg-gradient-to-r ${gradientClass} h-3 rounded-full transition-all duration-500 shadow-sm" 
                         style="width: ${percentage}%"></div>
                </div>
                <div class="text-center">
                    <span class="text-2xl font-bold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent">
                        ${percentage}%
                    </span>
                    <span class="text-sm text-gray-600 ml-2">complete</span>
                </div>
            </div>
        `;
    }

    updateQuickStats(hospitalStats, ambulanceStats) {
        // This method is called from the main app but we handle stats display in renderStats
        // So this is just a placeholder to prevent the error
        console.log('Quick stats updated:', { hospitalStats, ambulanceStats });
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
    
    // Make dashboard app globally accessible for cross-page refreshes
    window.dashboardApp = app;
    
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
