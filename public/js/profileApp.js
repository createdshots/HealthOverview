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

                // Check if we need to show onboarding
                if (!onboardingCompleted || isOnboarding) {
                    showOnboardingModal();
                } else {
                    // Show profile content
                    profileContent.classList.remove('hidden');
                    renderProfile();
                }

            } catch (error) {
                console.error('Error loading user data:', error);
                showStatusMessage('Error loading profile data', 'error');
                // Still show onboarding for new users
                showOnboardingModal();
            } finally {
                loadingOverlay.style.display = 'none';
            }

        } else {
            // Not signed in
            loadingOverlay.style.display = 'none';
            profileContent.classList.add('hidden');
            notSignedInDiv.classList.remove('hidden');
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
                                       class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-purple-500 focus:border-purple-500"
                                       placeholder="How should we address you?">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">🚨 Emergency Contact</label>
                                <input type="text" 
                                       id="emergency-contact" 
                                       name="emergencyContact"
                                       value="${currentUserData?.emergencyContact || ''}"
                                       class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-purple-500 focus:border-purple-500"
                                       placeholder="Optional">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">📝 Medical Notes</label>
                                <textarea id="medical-notes" 
                                          name="medicalNotes"
                                          rows="2"
                                          class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-purple-500 focus:border-purple-500"
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
                        
                        <div class="grid grid-cols-1 gap-1.5 overflow-hidden" id="conditions-grid" style="max-height: 240px;">
                            ${availableConditions.map(condition => `
                                <div class="onboarding-condition-card p-2 rounded cursor-pointer" 
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
                        
                        <div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
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
                profileSetupDate: new Date().toISOString()
            };

            await saveUserData(currentUser.uid, userData);
            currentUserData = userData;
            
            hideModal();
            showStatusMessage('Profile setup completed successfully!', 'success');
            
            // Update URL to remove onboarding parameter
            const url = new URL(window.location);
            url.searchParams.delete('onboarding');
            window.history.replaceState({}, '', url);
            
            // Show profile content
            profileContent.classList.remove('hidden');
            renderProfile();
            
        } catch (error) {
            console.error('Error completing onboarding:', error);
            showStatusMessage('Error saving profile. Please try again.', 'error');
        }
    }

    function renderProfile() {
        // Profile rendering logic will go here
        // For now, just show a basic profile
        const content = document.getElementById('profile-tab-content');
        if (content) {
            content.innerHTML = `
                <div class="text-center py-8">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Profile Setup Complete!</h3>
                    <p class="text-gray-600 mb-4">Your health tracking profile is ready.</p>
                    <div class="space-y-2">
                        <p><strong>Conditions tracked:</strong> ${currentUserData?.conditions?.length || 0}</p>
                        <p><strong>Setup date:</strong> ${currentUserData?.profileSetupDate ? new Date(currentUserData.profileSetupDate).toLocaleDateString() : 'Today'}</p>
                    </div>
                    <div class="mt-6">
                        <a href="/dashboard.html" 
                           class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                            Go to Dashboard
                        </a>
                    </div>
                </div>
            `;
        }
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
                                <p class="text-3xl font-bold">${userData.conditions?.length || 0}</p>
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
                                <p class="text-3xl font-bold">${userData.medicalRecords?.length || 0}</p>
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
                
                <!-- Logged Symptoms Card -->
                <div class="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-green-500 to-green-600 text-white transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div class="relative">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-green-100 text-sm font-medium">Logged Symptoms</p>
                                <p class="text-3xl font-bold">${userData.symptoms?.length || 0}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-200">
                                <span class="text-2xl">📝</span>
                            </div>
                        </div>
                        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div class="h-full bg-white/40 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Days Active Card -->
                <div class="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div class="relative">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <p class="text-orange-100 text-sm font-medium">Days Active</p>
                                <p class="text-3xl font-bold">${daysSinceJoin}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-200">
                                <span class="text-2xl">⏰</span>
                            </div>
                        </div>
                        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div class="h-full bg-white/40 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add edit profile functionality
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                showOnboardingModal(auth.currentUser, userData);
            });
        }
    }
});
