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
            <div class="onboarding-gradient text-white p-8 rounded-t-xl">
                <div class="text-center">
                    <div class="text-4xl mb-4">🏥</div>
                    <h2 class="text-2xl font-bold mb-2">Welcome to Health Overview!</h2>
                    <p class="text-purple-100">Let's set up your health tracking profile</p>
                </div>
            </div>
            
            <div class="p-8">
                <form id="onboarding-form" class="space-y-6">
                    <!-- User Info Section -->
                    <div class="onboarding-user-info p-4 rounded-lg">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                <input type="text" 
                                       id="display-name" 
                                       name="displayName"
                                       value="${currentUserData?.displayName || currentUser?.displayName || ''}"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                       placeholder="How should we address you?">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Emergency Contact (Optional)</label>
                                <input type="text" 
                                       id="emergency-contact" 
                                       name="emergencyContact"
                                       value="${currentUserData?.emergencyContact || ''}"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                       placeholder="Emergency contact info">
                            </div>
                        </div>
                    </div>

                    <!-- Condition Selection -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-3">What conditions would you like to track?</h3>
                        <p class="text-sm text-gray-600 mb-4">Select the health conditions you'd like to monitor. You can always change this later.</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="conditions-grid">
                            ${availableConditions.map(condition => `
                                <div class="onboarding-condition-card p-4 rounded-lg cursor-pointer" 
                                     data-condition="${condition.id}">
                                    <div class="flex items-start space-x-3">
                                        <div class="text-2xl">${condition.icon}</div>
                                        <div class="flex-1">
                                            <h4 class="font-medium text-gray-800">${condition.name}</h4>
                                            <p class="text-xs text-gray-600 mt-1">${condition.description}</p>
                                        </div>
                                        <div class="condition-checkbox hidden">
                                            <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Medical Notes -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Medical Notes / Allergies (Optional)</label>
                        <textarea id="medical-notes" 
                                  name="medicalNotes"
                                  rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Any important medical information, allergies, or notes for healthcare providers...">${currentUserData?.medicalNotes || ''}</textarea>
                    </div>

                    <!-- Privacy Notice -->
                    <div class="privacy-card p-4 rounded-lg">
                        <div class="flex items-start space-x-3">
                            <div class="text-green-600 text-xl">🔒</div>
                            <div>
                                <h4 class="font-medium text-green-800">Your Privacy Matters</h4>
                                <p class="text-sm text-green-700 mt-1">
                                    Your health data is encrypted and stored securely. Only you can access your information,
                                    and we never share it with third parties.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-between items-center pt-4">
                        <button type="button" 
                                id="skip-onboarding"
                                class="text-gray-500 hover:text-gray-700 font-medium">
                            Skip for now
                        </button>
                        <button type="submit" 
                                class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium">
                            Complete Setup
                        </button>
                    </div>
                </form>
            </div>
        `;

        showModal(modalContent, false);
        setupOnboardingEventListeners();
    }

    function setupOnboardingEventListeners() {
        const form = document.getElementById('onboarding-form');
        const conditionCards = document.querySelectorAll('.onboarding-condition-card');
        const skipBtn = document.getElementById('skip-onboarding');
        let selectedConditions = new Set(currentUserData?.conditions || []);

        // Handle condition selection
        conditionCards.forEach(card => {
            const conditionId = card.dataset.condition;
            
            // Set initial state
            if (selectedConditions.has(conditionId)) {
                card.classList.add('selected');
                card.querySelector('.condition-checkbox').classList.remove('hidden');
            }

            card.addEventListener('click', () => {
                if (selectedConditions.has(conditionId)) {
                    selectedConditions.delete(conditionId);
                    card.classList.remove('selected');
                    card.querySelector('.condition-checkbox').classList.add('hidden');
                } else {
                    selectedConditions.add(conditionId);
                    card.classList.add('selected');
                    card.querySelector('.condition-checkbox').classList.remove('hidden');
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
            const formData = new FormData(document.getElementById('onboarding-form'));
            
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
});
