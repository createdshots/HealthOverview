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

    const urlParams = new URLSearchParams(window.location.search);
    const isOnboarding = urlParams.get('onboarding') === 'true';

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            personalGreeting.textContent = `Welcome, ${user.displayName || user.email || 'User'}`;
            notSignedInDiv.classList.add('hidden');

            try {
                const { userData, onboardingCompleted } = await loadUserData(user.uid);
                
                if (userData) {
                    renderProfile(userData);
                    profileContent.classList.remove('hidden');
                }

                // Only show onboarding if specifically requested AND not completed
                if (isOnboarding && !onboardingCompleted) {
                    showOnboardingModal(user, userData || {});
                } else if (isOnboarding && onboardingCompleted) {
                    // If onboarding is complete but URL has onboarding=true, redirect to dashboard
                    showStatusMessage('Profile already complete! Redirecting to dashboard...', 'info');
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 2000);
                }

            } catch (error) {
                console.error('Error loading user data:', error);
                showStatusMessage('Error loading profile data', 'error');
            } finally {
                loadingOverlay.style.display = 'none';
            }

        } else {
            notSignedInDiv.classList.remove('hidden');
            profileContent.classList.add('hidden');
            loadingOverlay.style.display = 'none';
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
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to Health Overview!</h2>
                <p class="text-gray-600">Let's set up your health tracking profile. Select the conditions you'd like to track:</p>
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
                    <h3 class="font-medium text-gray-900">Optional Information</h3>
                    
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
                    <button type="submit" 
                            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Complete Setup
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
                onboardingDate: new Date().toISOString()
            };

            try {
                await saveUserData(user.uid, profileData);
                hideModal();
                showStatusMessage('Profile setup complete! Redirecting to dashboard...', 'success');
                
                // Clear the onboarding parameter and redirect
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error saving profile:', error);
                showStatusMessage('Error saving profile. Please try again.', 'error');
            }
        });
    }

    function renderProfile(userData) {
        const profileContainer = document.getElementById('profile-container');
        if (!profileContainer) return;

        const conditions = userData.conditions || [];
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

        profileContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">Profile Information</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Display Name</label>
                        <p class="mt-1 text-gray-900">${userData.displayName || 'Not set'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Emergency Contact</label>
                        <p class="mt-1 text-gray-900">${userData.emergencyContact || 'Not set'}</p>
                    </div>
                </div>

                ${userData.medicalNotes ? `
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700">Medical Notes</label>
                    <p class="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">${userData.medicalNotes}</p>
                </div>
                ` : ''}

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">Tracked Conditions</label>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        ${conditions.length > 0 
                            ? conditions.map(condition => `
                                <span class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
                                    ${conditionNames[condition] || condition}
                                </span>
                            `).join('')
                            : '<p class="text-gray-500 italic">No conditions selected</p>'
                        }
                    </div>
                </div>

                <button id="edit-profile-btn" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Edit Profile
                </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button class="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors">
                        📝 Log Symptoms
                    </button>
                    <button class="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                        🏥 Add Medical Record
                    </button>
                    <button class="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                        📊 View Health Stats
                    </button>
                    <button class="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            onclick="window.location.href='/dashboard.html'">
                        🏠 Go to Dashboard
                    </button>
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
