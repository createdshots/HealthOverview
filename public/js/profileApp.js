import { auth, onAuthStateChanged, signOut } from '/firebaseConfig.js';
import { loadUserData, saveUserData } from './data/enhancedDataManager.js';
import { showModal, hideModal } from './components/modal.js';
import { showStatusMessage } from './utils/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const profileContent = document.getElementById('profile-content');
    const notSignedInDiv = document.getElementById('not-signed-in');
    const signoutBtn = document.getElementById('signout-btn');
    const personalGreeting = document.getElementById('personal-greeting');
    const userDisplayName = document.getElementById('user-display-name');

    const urlParams = new URLSearchParams(window.location.search);
    const isOnboarding = urlParams.get('onboarding') === 'true';

    let currentUserData = null;
    let currentUser = null;

    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            personalGreeting.textContent = `Welcome back, ${user.displayName || user.email || 'User'}`;
            notSignedInDiv.classList.add('hidden');

            try {
                const { userData, onboardingCompleted } = await loadUserData(user.uid);
                currentUserData = userData || {};
                
                // Update user display name in header
                const displayName = currentUserData.displayName || user.displayName || user.email || 'User';
                userDisplayName.textContent = displayName;
                userDisplayName.classList.remove('hidden');
                
                if (userData) {
                    renderFullProfile(userData, user);
                    profileContent.classList.remove('hidden');
                }

                // Only show onboarding if specifically requested AND not completed
                if (isOnboarding && !onboardingCompleted) {
                    showOnboardingModal(user, userData || {});
                } else if (isOnboarding && onboardingCompleted) {
                    showStatusMessage('Profile already complete! Redirecting to dashboard...', 'info');
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 2000);
                }

            } catch (error) {
                console.error('Error loading user data:', error);
                showStatusMessage('Error loading profile data', 'error');
            } finally {
                loadingOverlay.classList.add('hidden');
            }

        } else {
            notSignedInDiv.classList.remove('hidden');
            profileContent.classList.add('hidden');
            userDisplayName.classList.add('hidden');
            loadingOverlay.classList.add('hidden');
        }
    });

    // Sign out button
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

    function renderFullProfile(userData, user) {
        // Calculate join date
        const joinDate = userData.onboardingDate ? new Date(userData.onboardingDate) : new Date();
        const daysSinceJoin = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
        
        // Calculate stats
        const totalRecords = userData.medicalRecords?.length || 0;
        const totalConditions = userData.conditions?.length || 0;
        const totalSymptoms = userData.symptoms?.length || 0;
        
        // Render profile header
        renderProfileHeader(userData, user, joinDate, daysSinceJoin);
        
        // Render the overview tab by default
        renderOverviewTab(userData);
        
        // Setup tab switching
        setupTabSwitching(userData);
    }

    function renderProfileHeader(userData, user, joinDate, daysSinceJoin) {
        const headerContainer = document.getElementById('profile-header-and-stats');
        const displayName = userData.displayName || user.displayName || 'Health Tracker User';
        const memberSince = joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        headerContainer.innerHTML = `
            <!-- Profile Header with Gradient -->
            <div class="profile-gradient rounded-xl p-8 mb-6 text-white">
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div class="flex items-center space-x-4 mb-4 md:mb-0">
                        <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold">${displayName}</h1>
                            <p class="text-blue-100">Member since ${memberSince}</p>
                            <p class="text-blue-100 text-sm">${daysSinceJoin} days on your health journey</p>
                        </div>
                    </div>
                    <button id="edit-profile-btn" class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-2 rounded-lg transition-all">
                        ✏️ Edit Profile
                    </button>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="stat-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">Tracked Conditions</p>
                            <p class="text-3xl font-bold text-purple-600">${userData.conditions?.length || 0}</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span class="text-2xl">🏥</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">Medical Records</p>
                            <p class="text-3xl font-bold text-blue-600">${userData.medicalRecords?.length || 0}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span class="text-2xl">📋</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">Logged Symptoms</p>
                            <p class="text-3xl font-bold text-green-600">${userData.symptoms?.length || 0}</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span class="text-2xl">📝</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card rounded-xl p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-600 text-sm font-medium">Days Active</p>
                            <p class="text-3xl font-bold text-orange-600">${daysSinceJoin}</p>
                        </div>
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span class="text-2xl">⏰</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add edit profile functionality
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                showOnboardingModal(currentUser, currentUserData);
            });
        }
    }

    function setupTabSwitching(userData) {
        const tabButtons = document.querySelectorAll('.profile-tab-btn');
        const tabContent = document.getElementById('profile-tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active tab button
                tabButtons.forEach(btn => {
                    btn.classList.remove('border-purple-500', 'text-purple-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                button.classList.remove('border-transparent', 'text-gray-500');
                button.classList.add('border-purple-500', 'text-purple-600');

                // Render appropriate tab content
                const tabName = button.getAttribute('data-tab');
                switch (tabName) {
                    case 'overview':
                        renderOverviewTab(userData);
                        break;
                    case 'conditions':
                        renderConditionsTab(userData);
                        break;
                    case 'records':
                        renderRecordsTab(userData);
                        break;
                    case 'analytics':
                        renderAnalyticsTab(userData);
                        break;
                    case 'symptoms':
                        renderSymptomsTab(userData);
                        break;
                }
            });
        });
    }

    function renderOverviewTab(userData) {
        const tabContent = document.getElementById('profile-tab-content');
        const conditions = userData.conditions || [];
        const recentRecords = (userData.medicalRecords || []).slice(-3);
        
        const conditionNames = {
            'epilepsy': '🧠 Epilepsy',
            'autism': '🌟 Autism Spectrum',
            'diabetes': '🩸 Diabetes',
            'mental_health': '🧠 Mental Health',
            'chronic_pain': '😣 Chronic Pain',
            'heart_condition': '❤️ Heart Condition',
            'respiratory': '🫁 Respiratory',
            'autoimmune': '🛡️ Autoimmune',
            'neurological': '🧠 Neurological',
            'gastrointestinal': '🫃 Gastrointestinal'
        };

        tabContent.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Quick Actions -->
                <div class="bg-gray-50 rounded-xl p-6">
                    <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <button class="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            📝 Log Symptoms
                        </button>
                        <button class="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm">
                            🏥 Add Record
                        </button>
                        <button class="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                            📊 View Analytics
                        </button>
                        <button class="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                                onclick="window.location.href='/dashboard.html'">
                            🏠 Dashboard
                        </button>
                    </div>
                </div>

                <!-- Tracked Conditions -->
                <div class="bg-gray-50 rounded-xl p-6">
                    <h3 class="text-lg font-semibold mb-4">Tracked Conditions</h3>
                    ${conditions.length > 0 
                        ? `<div class="flex flex-wrap gap-2">
                            ${conditions.map(condition => `
                                <span class="condition-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-purple-800">
                                    ${conditionNames[condition] || condition}
                                </span>
                            `).join('')}
                        </div>`
                        : '<p class="text-gray-500 italic">No conditions selected yet</p>'
                    }
                </div>

                <!-- Recent Activity -->
                <div class="bg-gray-50 rounded-xl p-6 lg:col-span-2">
                    <h3 class="text-lg font-semibold mb-4">Recent Medical Records</h3>
                    ${recentRecords.length > 0
                        ? `<div class="space-y-3">
                            ${recentRecords.map(record => `
                                <div class="bg-white p-4 rounded-lg border border-gray-200">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h4 class="font-medium">${record.title || 'Medical Record'}</h4>
                                            <p class="text-sm text-gray-600">${record.location || 'Unknown location'}</p>
                                            <p class="text-xs text-gray-500 mt-1">${new Date(record.date).toLocaleDateString()}</p>
                                        </div>
                                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            ${record.type || 'General'}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`
                        : '<p class="text-gray-500 italic">No medical records yet</p>'
                    }
                </div>
            </div>
        `;
    }

    function renderConditionsTab(userData) {
        const tabContent = document.getElementById('profile-tab-content');
        const conditions = userData.conditions || [];
        
        const allConditions = [
            { id: 'epilepsy', name: '🧠 Epilepsy', description: 'Seizure tracking and management' },
            { id: 'autism', name: '🌟 Autism Spectrum', description: 'Sensory and behavioral tracking' },
            { id: 'diabetes', name: '🩸 Diabetes', description: 'Blood sugar and medication tracking' },
            { id: 'mental_health', name: '🧠 Mental Health', description: 'Mood and anxiety tracking' },
            { id: 'chronic_pain', name: '😣 Chronic Pain', description: 'Pain levels and triggers' },
            { id: 'heart_condition', name: '❤️ Heart Condition', description: 'Heart rate and symptoms' },
            { id: 'respiratory', name: '🫁 Respiratory', description: 'Breathing and lung function' },
            { id: 'autoimmune', name: '🛡️ Autoimmune', description: 'Flares and symptoms' },
            { id: 'neurological', name: '🧠 Neurological', description: 'Neurological symptoms' },
            { id: 'gastrointestinal', name: '🫃 Gastrointestinal', description: 'Digestive health tracking' }
        ];

        tabContent.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">My Health Conditions</h3>
                    <button id="manage-conditions-btn" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Manage Conditions
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${allConditions.map(condition => {
                        const isTracked = conditions.includes(condition.id);
                        return `
                            <div class="bg-white p-4 rounded-lg border ${isTracked ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <h4 class="font-medium ${isTracked ? 'text-purple-900' : 'text-gray-900'}">${condition.name}</h4>
                                        <p class="text-sm ${isTracked ? 'text-purple-700' : 'text-gray-600'} mt-1">${condition.description}</p>
                                    </div>
                                    <div class="ml-3">
                                        ${isTracked 
                                            ? '<span class="text-green-600 text-xl">✓</span>' 
                                            : '<span class="text-gray-400 text-xl">○</span>'
                                        }
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Add manage conditions functionality
        const manageBtn = document.getElementById('manage-conditions-btn');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => {
                showOnboardingModal(currentUser, currentUserData);
            });
        }
    }

    function renderRecordsTab(userData) {
        const tabContent = document.getElementById('profile-tab-content');
        const records = userData.medicalRecords || [];

        tabContent.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Medical Records</h3>
                    <button id="add-record-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        + Add Record
                    </button>
                </div>
                
                ${records.length > 0
                    ? `<div class="space-y-4">
                        ${records.map((record, index) => `
                            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <div class="flex justify-between items-start mb-3">
                                    <h4 class="font-semibold text-lg">${record.title || 'Medical Record'}</h4>
                                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        ${record.type || 'General'}
                                    </span>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span class="font-medium">Date:</span> ${new Date(record.date).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <span class="font-medium">Location:</span> ${record.location || 'Not specified'}
                                    </div>
                                </div>
                                ${record.notes ? `
                                    <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <span class="font-medium text-sm text-gray-700">Notes:</span>
                                        <p class="text-sm text-gray-600 mt-1">${record.notes}</p>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>`
                    : `<div class="text-center py-12">
                        <div class="text-gray-400 text-6xl mb-4">📋</div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Medical Records Yet</h3>
                        <p class="text-gray-600 mb-4">Start tracking your health journey by adding your first medical record.</p>
                        <button class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            Add Your First Record
                        </button>
                    </div>`
                }
            </div>
        `;
    }

    function renderAnalyticsTab(userData) {
        const tabContent = document.getElementById('profile-tab-content');
        
        tabContent.innerHTML = `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold">Health Analytics</h3>
                
                <div class="text-center py-12">
                    <div class="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                    <p class="text-gray-600">We're working on detailed analytics to help you track your health trends and patterns.</p>
                </div>
            </div>
        `;
    }

    function renderSymptomsTab(userData) {
        const tabContent = document.getElementById('profile-tab-content');
        const symptoms = userData.symptoms || [];
        
        tabContent.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Symptom Tracking</h3>
                    <button id="log-symptom-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        + Log Symptom
                    </button>
                </div>
                
                ${symptoms.length > 0
                    ? `<div class="space-y-3">
                        ${symptoms.map(symptom => `
                            <div class="bg-white p-4 rounded-lg border border-gray-200">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-medium">${symptom.name}</h4>
                                        <p class="text-sm text-gray-600">Severity: ${symptom.severity}/10</p>
                                        <p class="text-xs text-gray-500">${new Date(symptom.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                    : `<div class="text-center py-12">
                        <div class="text-gray-400 text-6xl mb-4">📝</div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No Symptoms Logged</h3>
                        <p class="text-gray-600 mb-4">Start tracking your symptoms to identify patterns and triggers.</p>
                        <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Log Your First Symptom
                        </button>
                    </div>`
                }
            </div>
        `;
    }

    function showOnboardingModal(user, userData) {
        const conditions = [
            { id: 'epilepsy', name: '🧠 Epilepsy', description: 'Seizure tracking and management' },
            { id: 'autism', name: '🌟 Autism Spectrum', description: 'Sensory and behavioral tracking' },
            { id: 'diabetes', name: '🩸 Diabetes', description: 'Blood sugar and medication tracking' },
            { id: 'mental_health', name: '🧠 Mental Health', description: 'Mood and anxiety tracking' },
            { id: 'chronic_pain', name: '😣 Chronic Pain', description: 'Pain levels and triggers' },
            { id: 'heart_condition', name: '❤️ Heart Condition', description: 'Heart rate and symptoms' },
            { id: 'respiratory', name: '🫁 Respiratory', description: 'Breathing and lung function' },
            { id: 'autoimmune', name: '🛡️ Autoimmune', description: 'Flares and symptoms' },
            { id: 'neurological', name: '🧠 Neurological', description: 'Neurological symptoms' },
            { id: 'gastrointestinal', name: '🫃 Gastrointestinal', description: 'Digestive health tracking' }
        ];

        const selectedConditions = userData.conditions || [];

        const modalContent = `
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">
                    ${isOnboarding ? 'Welcome to Health Overview!' : 'Update Your Profile'}
                </h2>
                <p class="text-gray-600">
                    ${isOnboarding ? "Let's set up your health tracking profile. Select the conditions you'd like to track:" : 'Update your health conditions and profile information:'}
                </p>
            </div>
            
            <form id="onboarding-form" class="space-y-6">
                <!-- Condition Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        Health Conditions to Track
                    </label>
                    <div class="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                        ${conditions.map(condition => `
                            <label class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" 
                                       name="conditions" 
                                       value="${condition.id}"
                                       class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                       ${selectedConditions.includes(condition.id) ? 'checked' : ''}>
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">${condition.name}</div>
                                    <div class="text-sm text-gray-500">${condition.description}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Optional Basic Info -->
                <div class="space-y-4 pt-4 border-t border-gray-200">
                    <h3 class="font-medium text-gray-900">Profile Information</h3>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Display Name
                        </label>
                        <input type="text" 
                               name="displayName" 
                               value="${userData.displayName || user.displayName || ''}"
                               placeholder="How you'd like to be addressed"
                               class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Emergency Contact
                        </label>
                        <input type="text" 
                               name="emergencyContact" 
                               value="${userData.emergencyContact || ''}"
                               placeholder="Name and phone number"
                               class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Medical Notes/Allergies
                        </label>
                        <textarea name="medicalNotes" 
                                  rows="3"
                                  placeholder="Important medical information, allergies, etc."
                                  class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">${userData.medicalNotes || ''}</textarea>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4">
                    ${!isOnboarding ? `<button type="button" id="cancel-onboarding" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>` : ''}
                    <button type="submit" 
                            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        ${isOnboarding ? 'Complete Setup' : 'Save Changes'}
                    </button>
                </div>
            </form>
        `;

        showModal(modalContent, false); // Not dismissible

        // Handle form submission
        const form = document.getElementById('onboarding-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const selectedConditions = formData.getAll('conditions');
            
            const profileData = {
                conditions: selectedConditions,
                displayName: formData.get('displayName') || user.displayName || '',
                emergencyContact: formData.get('emergencyContact') || '',
                medicalNotes: formData.get('medicalNotes') || '',
                onboardingCompleted: true,
                onboardingDate: userData.onboardingDate || new Date().toISOString()
            };

            try {
                await saveUserData(user.uid, profileData);
                currentUserData = { ...currentUserData, ...profileData };
                hideModal();
                showStatusMessage(isOnboarding ? 'Profile setup complete!' : 'Profile updated successfully!', 'success');
                
                // Re-render the profile with new data
                renderFullProfile(currentUserData, user);
                
                // If they were in the onboarding flow, redirect to dashboard
                if (isOnboarding) {
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 2000);
                }
                
            } catch (error) {
                console.error('Error saving profile:', error);
                showStatusMessage('Error saving profile. Please try again.', 'error');
            }
        });

        const cancelButton = document.getElementById('cancel-onboarding');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                hideModal();
            });
        }
    }
});
