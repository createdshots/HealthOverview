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
            personalGreeting.textContent = `Welcome, ${user.displayName || 'User'}`;
            notSignedInDiv.classList.add('hidden');

            try {
                const { userData, onboardingCompleted } = await loadUserData(user.uid);
                
                if (userData) {
                    renderProfile(userData);
                    profileContent.classList.remove('hidden');
                }

                if (isOnboarding && !onboardingCompleted) {
                    showOnboardingModal(user, userData || {});
                }

            } catch (error) {
                console.error("Error loading user data:", error);
                showStatusMessage('Failed to load profile data.', 'error');
            } finally {
                loadingOverlay.classList.add('hidden');
            }

        } else {
            loadingOverlay.classList.add('hidden');
            profileContent.classList.add('hidden');
            notSignedInDiv.classList.remove('hidden');
        }
    });

    signoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '/';
        }).catch((error) => {
            console.error('Sign Out Error', error);
            showStatusMessage('Failed to sign out.', 'error');
        });
    });

    function renderProfile(userData) {
        profileContent.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-md">
                <h2 class="text-2xl font-bold mb-6">Your Information</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Full Name</label>
                        <p class="mt-1 text-lg text-gray-900">${userData.name || 'Not set'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Email Address</label>
                        <p class="mt-1 text-lg text-gray-900">${userData.email || 'Not set'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Age</label>
                        <p class="mt-1 text-lg text-gray-900">${userData.age || 'Not set'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Blood Type</label>
                        <p class="mt-1 text-lg text-gray-900">${userData.bloodType || 'Not set'}</p>
                    </div>
                </div>
                <div class="mt-8 text-right">
                    <button id="edit-profile-btn" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Edit Profile</button>
                </div>
            </div>
        `;

        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            showOnboardingModal(auth.currentUser, userData);
        });
    }

    function showOnboardingModal(user, existingData) {
        const modalContent = `
            <h2 class="text-2xl font-bold mb-4">Complete Your Profile</h2>
            <p class="mb-6 text-gray-600">Please provide some basic information to get the most out of your dashboard.</p>
            <form id="onboarding-form">
                <div class="mb-4">
                    <label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="fullName" name="fullName" value="${existingData.name || user.displayName || ''}" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
                </div>
                <div class="mb-4">
                    <label for="age" class="block text-sm font-medium text-gray-700">Age</label>
                    <input type="number" id="age" name="age" value="${existingData.age || ''}" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
                </div>
                <div class="mb-4">
                    <label for="bloodType" class="block text-sm font-medium text-gray-700">Blood Type</label>
                    <select id="bloodType" name="bloodType" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required>
                        <option value="">Select...</option>
                        <option value="A+" ${existingData.bloodType === 'A+' ? 'selected' : ''}>A+</option>
                        <option value="A-" ${existingData.bloodType === 'A-' ? 'selected' : ''}>A-</option>
                        <option value="B+" ${existingData.bloodType === 'B+' ? 'selected' : ''}>B+</option>
                        <option value="B-" ${existingData.bloodType === 'B-' ? 'selected' : ''}>B-</option>
                        <option value="AB+" ${existingData.bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                        <option value="AB-" ${existingData.bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
                        <option value="O+" ${existingData.bloodType === 'O+' ? 'selected' : ''}>O+</option>
                        <option value="O-" ${existingData.bloodType === 'O-' ? 'selected' : ''}>O-</option>
                    </select>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" id="cancel-onboarding" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Save and Continue</button>
                </div>
            </form>
        `;

        showModal(modalContent, false); // false = not dismissible by clicking outside

        const form = document.getElementById('onboarding-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedData = {
                name: form.fullName.value,
                age: form.age.value,
                bloodType: form.bloodType.value,
                email: user.email,
                onboardingCompleted: true
            };

            try {
                await saveUserData(user.uid, updatedData);
                hideModal();
                showStatusMessage('Profile updated successfully!', 'success');
                renderProfile(updatedData); // Re-render profile with new data
                // If they were in the onboarding flow, redirect to dashboard
                if (isOnboarding) {
                    window.location.href = '/dashboard.html';
                }
            } catch (error) {
                console.error("Error saving data:", error);
                showStatusMessage('Failed to save profile.', 'error');
            }
        });

        const cancelButton = document.getElementById('cancel-onboarding');
        if (isOnboarding) {
            // If it's the mandatory onboarding, hide the cancel button.
            cancelButton.style.display = 'none';
        } else {
            cancelButton.addEventListener('click', () => {
                hideModal();
            });
        }
    }
});
