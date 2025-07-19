import { auth, onAuthStateChanged, signOut } from '/firebaseConfig.js';
import { loadUserData, saveUserData, enhancedDataManager } from './data/enhancedDataManager.js';
import { showModal, hideModal } from './components/modal.js';
import { showStatusMessage } from './utils/ui.js';
import { symptomTracker, showSymptomTracker, showSymptomOverview } from './features/symptomTracker.js';

document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const profileContent = document.getElementById('profile-content');
    const notSignedInDiv = document.getElementById('not-signed-in');
    const signoutBtn = document.getElementById('signout-btn');
    const personalGreeting = document.getElementById('personal-greeting');
    const userDisplayName = document.getElementById('user-display-name');
    const addRecordBtn = document.getElementById('add-record-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const isOnboarding = urlParams.get('onboarding') === 'true';

    let currentUserData = null;
    let currentUser = null;

    // Available conditions for tracking
    const availableConditions = [
        { id: 'epilepsy', name: 'Epilepsy', icon: '🧠', description: 'Seizure tracking and management' },
        { id: 'autism', name: 'Autism Spectrum', icon: '🌟', description: 'Sensory and behavioral tracking' },
        { id: 'diabetes', name: 'Diabetes', icon: '🩸', description: 'Blood sugar and medication tracking' },
        { id: 'mental_health', name: 'Mental Health', icon: '🧠', description: 'Mood and mental wellness tracking' },
        { id: 'chronic_pain', name: 'Chronic Pain', icon: '😣', description: 'Pain levels and management' },
        { id: 'heart_condition', name: 'Heart Condition', icon: '❤️', description: 'Cardiovascular health tracking' },
        { id: 'respiratory', name: 'Respiratory', icon: '🫁', description: 'Breathing and lung health' },
        { id: 'autoimmune', name: 'Autoimmune', icon: '🛡️', description: 'Immune system tracking' },
        { id: 'neurological', name: 'Neurological', icon: '🧠', description: 'Nervous system conditions' },
        { id: 'gastrointestinal', name: 'Gastrointestinal', icon: '🫃', description: 'Digestive health tracking' }
    ];

    // Initialize enhanced data manager for profile
    enhancedDataManager.onStatusMessage((message, type) => {
        showStatusMessage(message, type);
    });

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            personalGreeting.textContent = `Welcome back, ${user.displayName || user.email || 'User'}`;
            if (notSignedInDiv) notSignedInDiv.classList.add('hidden');

            // Set up data manager
            enhancedDataManager.setUserId(user.uid);

            // Set up symptom tracker
            symptomTracker.setDataManager(enhancedDataManager);
            symptomTracker.setCurrentUser(user);
            symptomTracker.onStatus((message, type) => {
                showStatusMessage(message, type);
            });

            try {
                // Load user data first
                const onboardingCompleted = await enhancedDataManager.loadUserData();
                currentUserData = enhancedDataManager.getData();

                // Check if data is empty and needs initialization
                if (!currentUserData.hospitals || currentUserData.hospitals.length === 0) {
                    console.log('No hospital data found, initializing default data...');
                    await enhancedDataManager.initializeDefaultData();
                    currentUserData = enhancedDataManager.getData();
                }

                // Only show onboarding if specifically requested AND not completed
                if (isOnboarding && !onboardingCompleted) {
                    showOnboardingModal();
                } else {
                    profileContent.classList.remove('hidden');
                    renderFullProfile(currentUserData, user);
                }

            } catch (error) {
                console.error('Error loading user data:', error);
                showStatusMessage('Error loading profile data', 'error');
                
                // Try to initialize default data as fallback
                await enhancedDataManager.initializeDefaultData();
                currentUserData = enhancedDataManager.getData();
                profileContent.classList.remove('hidden');
                renderFullProfile(currentUserData, user);
            } finally {
                loadingOverlay.style.display = 'none';
            }

        } else {
            if (notSignedInDiv) notSignedInDiv.classList.remove('hidden');
            profileContent.classList.add('hidden');
            loadingOverlay.style.display = 'none';
        }
    });

    // Sign out handler
    if (signoutBtn) {
        signoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = '/index.html';
            } catch (error) {
                console.error('Sign out error:', error);
                showStatusMessage('Error signing out', 'error');
            }
        });
    }

    // Add Record button handler
    if (addRecordBtn) {
        addRecordBtn.addEventListener('click', () => {
            showSymptomTracker();
        });
    }

    function renderFullProfile(userData, user) {
        // Calculate join date
        const joinDate = userData.onboardingDate ? new Date(userData.onboardingDate) : new Date();
        const daysSinceJoin = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
        
        // Calculate stats
        const totalRecords = userData.medicalRecords?.length || 0;
        const totalConditions = userData.conditions?.length || 0;
        const totalSymptoms = userData.symptoms?.length || 0;
        const totalHospitals = userData.hospitals?.length || 0;
        const visitedHospitals = userData.hospitals?.filter(h => h.visited)?.length || 0;
        const totalAmbulance = userData.ambulance?.length || 0;
        const visitedAmbulance = userData.ambulance?.filter(a => a.visited)?.length || 0;
        
        // Render profile header with beautiful gradient
        renderProfileHeader(userData, user, joinDate, daysSinceJoin, {
            totalRecords,
            totalConditions, 
            totalHospitals,
            visitedHospitals,
            totalAmbulance,
            visitedAmbulance,
            daysSinceJoin
        });
        
        // Render the overview tab by default
        renderOverviewTab(userData);
        
        // Setup tab switching
        setupTabSwitching(userData);
    }

    function renderProfileHeader(userData, user, joinDate, daysSinceJoin, stats) {
        const headerContainer = document.getElementById('profile-header-and-stats');
        const displayName = userData.displayName || user.displayName || 'Health Tracker User';
        const memberSince = joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        headerContainer.innerHTML = `
            <!-- Profile Header with Beautiful Gradient -->
            <div class="relative overflow-hidden rounded-xl mb-6">
                <!-- Gradient Background -->
                <div class="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"></div>
                
                <!-- Animated Background Elements -->
                <div class="absolute inset-0 opacity-20">
                    <div class="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                    <div class="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
                    <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
                </div>
                
                <!-- Content -->
                <div class="relative p-8 text-white">
                    <div class="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <div class="flex items-center space-x-6 mb-4 md:mb-0">
                            <!-- Avatar Circle with Gradient Border -->
                            <div class="relative">
                                <div class="w-24 h-24 bg-gradient-to-br from-white to-blue-100 rounded-full flex items-center justify-center text-4xl font-bold text-purple-600 shadow-xl border-4 border-white/30">
                                    ${displayName.charAt(0).toUpperCase()}
                                </div>
                                <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                                    <span class="text-white text-sm">✓</span>
                                </div>
                            </div>
                            <div>
                                <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                    ${displayName}
                                </h1>
                                <p class="text-blue-100 text-lg font-medium">Member since ${memberSince}</p>
                                <p class="text-blue-200 text-sm flex items-center mt-1">
                                    <span class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                                    ${daysSinceJoin} days on your health journey
                                </p>
                            </div>
                        </div>
                        <button id="edit-profile-btn" class="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            <span class="flex items-center space-x-2">
                                <span class="text-xl">✏️</span>
                                <span class="font-semibold">Edit Profile</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Enhanced Stats Grid with Gradients -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <!-- Tracked Conditions Card -->
                <div class="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div class="relative">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-purple-100 text-sm font-medium">Tracked Conditions</p>
                                <p class="text-3xl font-bold">${stats.totalConditions}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-200">
                                <span class="text-2xl">🏥</span>
                            </div>
                        </div>
                        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div class="h-full bg-white/40 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Medical Records Card -->
                <div class="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div class="relative">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-blue-100 text-sm font-medium">Medical Records</p>
                                <p class="text-3xl font-bold">${stats.totalRecords}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-200">
                                <span class="text-2xl">📋</span>
                            </div>
                        </div>
                        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div class="h-full bg-white/40 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Hospitals Visited Card -->
                <div class="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-green-500 to-green-600 text-white transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div class="relative">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-green-100 text-sm font-medium">Hospitals Visited</p>
                                <p class="text-3xl font-bold">${stats.visitedHospitals}/${stats.totalHospitals}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-200">
                                <span class="text-2xl">🏥</span>
                            </div>
                        </div>
                        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div class="h-full bg-white/40 rounded-full animate-pulse" style="width: ${stats.totalHospitals > 0 ? (stats.visitedHospitals / stats.totalHospitals * 100) : 0}%"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Days Active Card -->
                <div class="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div class="relative">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-orange-100 text-sm font-medium">Ambulance Services</p>
                                <p class="text-3xl font-bold">${stats.visitedAmbulance}/${stats.totalAmbulance}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-200">
                                <span class="text-2xl">🚑</span>
                            </div>
                        </div>
                        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div class="h-full bg-white/40 rounded-full animate-pulse" style="width: ${stats.totalAmbulance > 0 ? (stats.visitedAmbulance / stats.totalAmbulance * 100) : 0}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add edit profile functionality
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                showOnboardingModal();
            });
        }
    }

    function setupTabSwitching(userData) {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('profile-tab-btn')) {
                // Remove active class from all tabs
                document.querySelectorAll('.profile-tab-btn').forEach(btn => {
                    btn.classList.remove('active', 'border-purple-500', 'text-purple-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });

                // Add active class to clicked tab
                e.target.classList.add('active', 'border-purple-500', 'text-purple-600');
                e.target.classList.remove('border-transparent', 'text-gray-500');

                // Get tab name
                const tabName = e.target.dataset.tab;

                // Render the appropriate tab content
                switch(tabName) {
                    case 'overview':
                        renderOverviewTab(userData);
                        break;
                    case 'conditions':
                        renderConditionsTab(userData);
                        break;
                    case 'records':
                        renderRecordsTab(userData);
                        break;
                    case 'symptoms':
                        renderSymptomsTab(userData);
                        break;
                    case 'analytics':
                        renderAnalyticsTab(userData);
                        break;
                }
            }
        });

        // Set up symptom tracker buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-symptom-record-btn') {
                e.preventDefault();
                showSymptomTracker();
            }
            if (e.target.id === 'view-symptom-overview-btn') {
                e.preventDefault();
                showSymptomOverview();
            }
        });
    }

    function renderOverviewTab(userData) {
        const content = document.getElementById('profile-tab-content');
        const medicalRecords = userData.medicalRecords || [];
        const recentRecords = medicalRecords.slice(-5).reverse();
        const conditions = userData.conditions || [];
        
        content.innerHTML = `
            <div class="space-y-6">
                <!-- Quick Actions -->
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                    <h3 class="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button id="add-symptom-record-btn" class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-3">
                            <span class="text-2xl">📝</span>
                            <div class="text-left">
                                <div class="font-semibold">Add Medical Record</div>
                                <div class="text-sm opacity-90">Log symptoms, visits, or treatments</div>
                            </div>
                        </button>
                        <button id="view-symptom-overview-btn" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-3">
                            <span class="text-2xl">📊</span>
                            <div class="text-left">
                                <div class="font-semibold">View Overview</div>
                                <div class="text-sm opacity-90">See your health analytics</div>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 class="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    ${recentRecords.length > 0 ? `
                        <div class="space-y-3">
                            ${recentRecords.map(record => `
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span class="text-blue-600 text-sm">📋</span>
                                    </div>
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">${record.incidentType?.replace('_', ' ') || 'Medical Record'}</div>
                                        <div class="text-sm text-gray-600">${record.timestamp ? new Date(record.timestamp).toLocaleDateString() : 'No date'}</div>
                                    </div>
                                    ${record.severity ? `<span class="px-2 py-1 text-xs rounded-full ${getSeverityColor(record.severity)}">${record.severity}/10</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <div class="text-4xl mb-3">📝</div>
                            <p>No recent activity yet.</p>
                            <p class="text-sm mt-1">Start by adding your first medical record!</p>
                        </div>
                    `}
                </div>

                <!-- Tracked Conditions Summary -->
                ${conditions.length > 0 ? `
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 class="text-xl font-semibold text-gray-900 mb-4">Your Conditions</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            ${conditions.map(conditionId => {
                                const condition = availableConditions.find(c => c.id === conditionId);
                                return condition ? `
                                    <div class="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                        <span class="text-2xl">${condition.icon}</span>
                                        <div>
                                            <div class="font-medium text-gray-900">${condition.name}</div>
                                            <div class="text-xs text-gray-600">${condition.description}</div>
                                        </div>
                                    </div>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 class="text-xl font-semibold text-gray-900 mb-4">Your Conditions</h3>
                        <div class="text-center py-8 text-gray-500">
                            <div class="text-4xl mb-3">🏥</div>
                            <p>No conditions selected yet.</p>
                            <p class="text-sm mt-1">Edit your profile to add conditions you'd like to track.</p>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    function renderConditionsTab(userData) {
        const content = document.getElementById('profile-tab-content');
        const conditions = userData.conditions || [];
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-gray-900">My Tracked Conditions</h3>
                    <button onclick="document.getElementById('edit-profile-btn').click()" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Edit Conditions
                    </button>
                </div>
                
                ${conditions.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${conditions.map(conditionId => {
                            const condition = availableConditions.find(c => c.id === conditionId);
                            if (!condition) return '';
                            
                            return `
                                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                                    <div class="flex items-center space-x-4 mb-4">
                                        <div class="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-2xl">
                                            ${condition.icon}
                                        </div>
                                        <div>
                                            <h4 class="text-lg font-semibold text-gray-900">${condition.name}</h4>
                                            <p class="text-sm text-gray-600">${condition.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="bg-gray-50 rounded-lg p-4">
                                        <div class="text-sm text-gray-600 mb-2">Recent Activity</div>
                                        <div class="text-xs text-gray-500">No recent records for this condition</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">🏥</div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Conditions Added Yet</h3>
                        <p class="text-gray-600 mb-6">Start tracking your health by adding the conditions you want to monitor.</p>
                        <button onclick="document.getElementById('edit-profile-btn').click()" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                            Add Your First Condition
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    function renderRecordsTab(userData) {
        const content = document.getElementById('profile-tab-content');
        const records = userData.medicalRecords || [];
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-gray-900">Medical Records</h3>
                    <button id="add-new-record-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Add New Record
                    </button>
                </div>
                
                ${records.length > 0 ? `
                    <div class="space-y-4">
                        ${records.map(record => `
                            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 class="text-lg font-semibold text-gray-900">${record.incidentType?.replace('_', ' ').toUpperCase() || 'Medical Record'}</h4>
                                        <p class="text-sm text-gray-600">${record.timestamp ? new Date(record.timestamp).toLocaleString() : 'No date'}</p>
                                    </div>
                                    ${record.severity ? `<span class="px-3 py-1 text-sm rounded-full ${getSeverityColor(record.severity)}">Severity: ${record.severity}/10</span>` : ''}
                                </div>
                                
                                ${record.hospital ? `<p class="text-sm text-gray-700 mb-2"><strong>Hospital:</strong> ${record.hospital}</p>` : ''}
                                ${record.ambulance ? `<p class="text-sm text-gray-700 mb-2"><strong>Ambulance:</strong> ${record.ambulance}</p>` : ''}
                                ${record.symptoms ? `<p class="text-sm text-gray-700 mb-2"><strong>Symptoms:</strong> ${record.symptoms}</p>` : ''}
                                ${record.treatment ? `<p class="text-sm text-gray-700 mb-2"><strong>Treatment:</strong> ${record.treatment}</p>` : ''}
                                ${record.notes ? `<p class="text-sm text-gray-700"><strong>Notes:</strong> ${record.notes}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">📋</div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">No Medical Records Yet</h3>
                        <p class="text-gray-600 mb-6">Start building your health history by adding your first medical record.</p>
                        <button id="add-first-record-btn" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                            Add Your First Record
                        </button>
                    </div>
                `}
            </div>
        `;

        // Add event listeners for new record buttons
        document.getElementById('add-new-record-btn')?.addEventListener('click', () => showSymptomTracker());
        document.getElementById('add-first-record-btn')?.addEventListener('click', () => showSymptomTracker());
    }

    function renderSymptomsTab(userData) {
        const content = document.getElementById('profile-tab-content');
        
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-gray-900">Symptom Tracker</h3>
                    <button id="track-symptoms-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Track Symptoms
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button id="log-symptom-btn" class="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-green-200 transition-all duration-200 text-left">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center text-xl">📝</div>
                            <div>
                                <h4 class="font-semibold text-gray-900">Log New Symptom</h4>
                                <p class="text-sm text-gray-600">Record symptoms and track severity</p>
                            </div>
                        </div>
                    </button>
                    
                    <button id="view-trends-btn" class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-left">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xl">📊</div>
                            <div>
                                <h4 class="font-semibold text-gray-900">View Trends</h4>
                                <p class="text-sm text-gray-600">Analyze your health patterns</p>
                            </div>
                        </div>
                    </button>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h4 class="font-semibold text-gray-900 mb-4">Recent Symptom Logs</h4>
                    <div class="text-center py-8 text-gray-500">
                        <div class="text-4xl mb-3">📊</div>
                        <p>No symptom logs yet.</p>
                        <p class="text-sm mt-1">Start tracking to see trends and patterns!</p>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('track-symptoms-btn')?.addEventListener('click', () => showSymptomTracker());
        document.getElementById('log-symptom-btn')?.addEventListener('click', () => showSymptomTracker());
        document.getElementById('view-trends-btn')?.addEventListener('click', () => showSymptomOverview());
    }

    function renderAnalyticsTab(userData) {
        const content = document.getElementById('profile-tab-content');
        
        content.innerHTML = `
            <div class="space-y-6">
                <h3 class="text-xl font-semibold text-gray-900">Health Analytics</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h4 class="font-semibold text-gray-900 mb-4">Symptom Trends</h4>
                        <div class="text-center py-8 text-gray-500">
                            <div class="text-4xl mb-3">📈</div>
                            <p>No data to analyze yet.</p>
                            <p class="text-sm mt-1">Start logging symptoms to see trends!</p>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h4 class="font-semibold text-gray-900 mb-4">Visit History</h4>
                        <div class="text-center py-8 text-gray-500">
                            <div class="text-4xl mb-3">🏥</div>
                            <p>No visit history yet.</p>
                            <p class="text-sm mt-1">Add medical records to track visits!</p>
                        </div>
                    </div>
                </div>
                
                <button id="view-full-analytics-btn" class="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
                    View Detailed Analytics
                </button>
            </div>
        `;

        // Add event listener
        document.getElementById('view-full-analytics-btn')?.addEventListener('click', () => showSymptomOverview());
    }

    function getSeverityColor(severity) {
        const level = parseInt(severity);
        if (level <= 3) return 'bg-green-100 text-green-800';
        if (level <= 6) return 'bg-yellow-100 text-yellow-800';
        if (level <= 8) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    }

    // Rest of your existing functions (showOnboardingModal, setupOnboardingEventListeners, completeOnboarding)
    // ... (keeping the existing onboarding code as is)

    function showOnboardingModal() {
        const modalContent = `
            <div class="onboarding-gradient text-white p-4 rounded-t-xl">
                <div class="text-center">
                    <div class="text-2xl mb-2">🏥</div>
                    <h2 class="text-lg font-bold mb-1">Welcome to Health Overview!</h2>
                    <p class="text-purple-100 text-sm">Let's set up your health tracking profile</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 p-4" style="max-height: 60vh;">
                <!-- Left Column: User Info & Privacy -->
                <div class="space-y-3">
                    <div class="onboarding-user-info p-3 rounded-lg">
                        <div class="flex items-center space-x-2 mb-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                                <span class="text-white text-sm">👤</span>
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-800">Your Profile</h3>
                                <p class="text-xs text-gray-600">Basic information</p>
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">🔤 Display Name</label>
                                <input type="text" 
                                       id="display-name" 
                                       name="displayName"
                                       value="${currentUserData?.displayName || currentUser?.displayName || ''}"
                                       class="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:border-purple-500"
                                       placeholder="How should we address you?">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">🚨 Emergency Contact</label>
                                <input type="text" 
                                       id="emergency-contact" 
                                       name="emergencyContact"
                                       value="${currentUserData?.emergencyContact || ''}"
                                       class="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:border-purple-500"
                                       placeholder="Optional">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">📝 Medical Notes</label>
                                <textarea id="medical-notes" 
                                          name="medicalNotes"
                                          rows="2"
                                          class="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:border-purple-500"
                                          placeholder="Allergies, important info...">${currentUserData?.medicalNotes || ''}</textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Privacy Section -->
                    <div class="privacy-card p-3 rounded-lg">
                        <div class="flex items-center space-x-2 mb-2">
                            <div class="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                                <span class="text-white text-xs">🔒</span>
                            </div>
                            <div>
                                <h4 class="text-xs font-medium text-green-800">Privacy & Data Protection</h4>
                                <p class="text-xs text-green-700">Your data is encrypted and secure. We never share it.</p>
                            </div>
                        </div>
                        
                        <div class="space-y-1">
                            <label class="flex items-start space-x-1">
                                <input type="checkbox" class="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded focus:ring-green-500">
                                <span class="text-xs text-green-800">I consent to secure data storage</span>
                            </label>
                            <label class="flex items-start space-x-1">
                                <input type="checkbox" class="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded focus:ring-green-500">
                                <span class="text-xs text-green-800">Anonymous analytics (optional)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Health Conditions -->
                <div class="space-y-3">
                    <div class="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                        <div class="flex items-center space-x-2 mb-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <span class="text-white text-sm">🏥</span>
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-800">Health Conditions</h3>
                                <p class="text-xs text-gray-600">Select what you'd like to track</p>
                            </div>
                        </div>
                        
                        <!-- SCROLLABLE CONDITIONS AREA -->
                        <div class="onboarding-conditions-scroll" id="conditions-grid">
                            ${availableConditions.map(condition => `
                                <div class="onboarding-condition-card p-2 rounded-lg cursor-pointer mb-1.5" 
                                     data-condition="${condition.id}">
                                    <div class="flex items-center space-x-2">
                                        <div class="text-sm">${condition.icon}</div>
                                        <div class="flex-1 min-w-0">
                                            <h4 class="font-medium text-gray-800 text-xs leading-tight">${condition.name}</h4>
                                            <p class="text-xs text-gray-600 leading-tight">${condition.description}</p>
                                        </div>
                                        <div class="condition-checkbox hidden">
                                            <svg class="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p class="text-xs text-blue-700">
                                💡 <strong>Tip:</strong> You can always change these later in your profile settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer spanning both columns -->
            <form id="onboarding-form" class="col-span-2">
                <div class="flex justify-between items-center pt-3 px-4 pb-3 border-t border-gray-200">
                    <button type="button" 
                            id="skip-onboarding"
                            class="text-gray-500 hover:text-gray-700 font-medium text-sm underline">
                        Skip for now
                    </button>
                    <button type="submit" 
                            class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium text-sm">
                        Complete Setup
                    </button>
                </div>
            </form>
        `;

        showModal(modalContent, false);
        
        // Use a small delay to ensure DOM elements are rendered
        setTimeout(() => {
            setupOnboardingEventListeners();
        }, 100);
    }

    function setupOnboardingEventListeners() {
        const form = document.getElementById('onboarding-form');
        const conditionCards = document.querySelectorAll('.onboarding-condition-card');
        const skipBtn = document.getElementById('skip-onboarding');
        
        // Check if elements exist before setting up listeners
        if (!form) {
            console.error('Onboarding form not found');
            return;
        }
        
        if (!skipBtn) {
            console.error('Skip button not found');
            return;
        }
        
        if (conditionCards.length === 0) {
            console.error('No condition cards found');
            return;
        }
        
        let selectedConditions = new Set(currentUserData?.conditions || []);

        // Handle condition selection
        conditionCards.forEach(card => {
            const conditionId = card.dataset.condition;
            
            // Set initial state
            if (selectedConditions.has(conditionId)) {
                card.classList.add('selected');
                const checkbox = card.querySelector('.condition-checkbox');
                if (checkbox) {
                    checkbox.classList.remove('hidden');
                }
            }

            card.addEventListener('click', () => {
                const checkbox = card.querySelector('.condition-checkbox');
                if (selectedConditions.has(conditionId)) {
                    selectedConditions.delete(conditionId);
                    card.classList.remove('selected');
                    if (checkbox) {
                        checkbox.classList.add('hidden');
                    }
                } else {
                    selectedConditions.add(conditionId);
                    card.classList.add('selected');
                    if (checkbox) {
                        checkbox.classList.remove('hidden');
                    }
                }
            });
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await completeOnboarding(selectedConditions);
        });

        // Handle skip
        skipBtn.addEventListener('click', async () => {
            await completeOnboarding(new Set());
        });
    }

    async function completeOnboarding(selectedConditions) {
        try {
            const form = document.getElementById('onboarding-form');
            if (!form) {
                throw new Error('Form not found');
            }
            
            const formData = new FormData(form);
            
            const userData = {
                ...currentUserData,
                displayName: formData.get('displayName') || currentUser?.displayName || 'User',
                emergencyContact: formData.get('emergencyContact') || '',
                medicalNotes: formData.get('medicalNotes') || '',
                conditions: Array.from(selectedConditions),
                onboardingCompleted: true,
                profileSetupDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            // Save to enhanced data manager and ensure it's persisted
            enhancedDataManager.setData(userData);
            
            // Wait for save to complete
            const saveSuccess = await enhancedDataManager.saveData();
            if (!saveSuccess) {
                throw new Error('Failed to save user data');
            }
            
            // Update current data to reflect saved state
            currentUserData = enhancedDataManager.getData();
            
            hideModal();
            showStatusMessage('Profile setup completed successfully! Redirecting to dashboard...', 'success');
            
            // Clear the onboarding parameter from URL
            const url = new URL(window.location);
            url.searchParams.delete('onboarding');
            window.history.replaceState({}, '', url);
            
            // Add onboarding completion flag to localStorage as backup
            localStorage.setItem('onboardingCompleted', 'true');
            localStorage.setItem('onboardingCompletedTime', new Date().toISOString());
            
            // Redirect to dashboard after ensuring data is saved
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 2000); // Increased delay to ensure Firestore consistency
            
        } catch (error) {
            console.error('Error completing onboarding:', error);
            showStatusMessage('Error saving profile. Please try again.', 'error');
        }
    }

    // Global function to refresh profile data (used by symptom tracker)
    window.refreshProfileData = async function() {
        if (currentUser) {
            await enhancedDataManager.loadUserData();
            currentUserData = enhancedDataManager.getData();
            renderFullProfile(currentUserData, currentUser);
        }
    };
});
