import { auth, onAuthStateChanged, signOut } from '/firebaseConfig.js';
import { loadUserData, saveUserData, enhancedDataManager } from './data/enhancedDataManager.js';
import { showModal, hideModal } from './components/modal.js';
import { showStatusMessage } from './utils/ui.js';
import { symptomTracker, showSymptomTracker, showSymptomOverview } from './features/symptomTracker.js';
import { adminAccessManager } from './admin/adminAccess.js';

// Global variables
let currentUser = null;
let currentUserData = null;
const isOnboarding = new URLSearchParams(window.location.search).has('onboarding');

// DOM elements
const personalGreeting = document.getElementById('personal-greeting');
const notSignedInDiv = document.getElementById('not-signed-in');
const profileContent = document.getElementById('profile-content');
const loadingOverlay = document.getElementById('loading-overlay');
const signoutBtn = document.getElementById('signout-btn');
const addRecordBtn = document.getElementById('add-record-btn');

document.addEventListener('DOMContentLoaded', () => {
    // Topbar styling update
    const header = document.querySelector('header');
    if (header) {
        header.classList.remove('rounded-full');
        header.classList.add('rounded-lg', 'border', 'border-gray-200', 'shadow-md', 'bg-white');
        header.style.borderRadius = '16px';
        header.style.margin = '16px';
        header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
    }

    // ProfileMedicalRecordsManager class
    class ProfileMedicalRecordsManager {
        constructor() {
            this.dataManager = window.enhancedDataManager || enhancedDataManager;
        }

        setDataManager(dataManager) {
            this.dataManager = dataManager;
        }

        showAddRecordModal() {
            import('./components/modal.js').then(({ showModal, hideModal }) => {
                import('./utils/ui.js').then(({ showStatusMessage }) => {
                    window.hideModal = hideModal;
                    window.showStatusMessage = showStatusMessage;
                    const data = this.dataManager.getData();
                    const userConditions = data.userProfile?.conditions || [];
                    const modalContent = this.generateEnhancedModalContent(userConditions);
                    showModal(modalContent, false);
                    setTimeout(() => {
                        const modalContent = document.getElementById('modal-content');
                        if (modalContent) {
                            modalContent.style.width = '95vw';
                            modalContent.style.maxWidth = '95vw';
                            modalContent.style.maxHeight = '90vh';
                        }
                        this.setupRecordFormListeners();
                    }, 50);
                });
            });
        }

        generateEnhancedModalContent(userConditions) {
            return `
                <div class="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-t-xl">
                    <div class="text-center">
                        <div class="text-4xl mb-3">📋</div>
                        <h2 class="text-2xl font-bold mb-2">Add Medical Record</h2>
                        <p class="text-indigo-100">Track your health journey with detailed records</p>
                    </div>
                </div>
                
                <!-- Scrollable Content Area -->
                <div class="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <form id="add-record-form" class="p-6 space-y-6">
                        <!-- Incident Type Selection -->
                        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-200">
                            <h3 class="text-xl font-bold text-indigo-800 mb-4 flex items-center">
                                <span class="text-2xl mr-3">🏥</span>
                                What type of incident?
                            </h3>
                            <input type="hidden" id="selected-type" name="incidentType" required>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                ${this.getIncidentTypes().map(type => `
                                    <div class="incident-type-card p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 transition-all duration-300 bg-white" data-type="${type.id}">
                                        <div class="text-center">
                                            <div class="text-3xl mb-2">${type.icon}</div>
                                            <div class="font-semibold text-indigo-800 text-sm">${type.name}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Basic Info -->
                        ${this.generateBasicInfoHTML()}

                        <!-- Condition-specific Symptoms -->
                        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200">
                            ${this.generateConditionSymptomsPanel(userConditions)}
                        </div>

                        <!-- General Symptoms -->
                        ${this.generateGeneralSymptomsHTML()}

                        <!-- Severity -->
                        ${this.generateSeverityHTML()}

                        <!-- Notes -->
                        ${this.generateNotesHTML()}

                        <!-- Action Buttons -->
                        ${this.generateActionButtonsHTML()}
                    </form>
                </div>
            `;
        }

        getIncidentTypes() {
            return [
                { id: 'emergency_visit', name: 'Emergency Visit', icon: '🚨' },
                { id: 'scheduled_appointment', name: 'Scheduled Appointment', icon: '📅' },
                { id: 'symptom_episode', name: 'Symptom Episode', icon: '🤒' },
                { id: 'medication_reaction', name: 'Medication Reaction', icon: '💊' },
                { id: 'follow_up', name: 'Follow-up Visit', icon: '🔄' },
                { id: 'test_results', name: 'Test Results', icon: '📊' }
            ];
        }

        generateBasicInfoHTML() {
            return `
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
            `;
        }

        generateConditionSymptomsPanel(userConditions) {
            if (!userConditions || userConditions.length === 0) {
                return `
                    <div class="text-center py-8">
                        <div class="text-6xl mb-4">🩺</div>
                        <h3 class="text-lg font-bold text-purple-800 mb-2">No Conditions Tracked</h3>
                        <p class="text-purple-600 text-sm mb-4">Add conditions to your profile to see personalized symptom tracking here.</p>
                        <div class="bg-white bg-opacity-60 p-4 rounded-xl border border-purple-200">
                            <p class="text-xs text-purple-700">📋 General symptoms are available in the main form</p>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="sticky top-0">
                    <h3 class="text-xl font-bold text-purple-800 mb-4 flex items-center">
                        <span class="text-2xl mr-3">🎯</span>
                        Your Conditions
                    </h3>
                    <div class="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        ${userConditions.map(condition => `
                            <div class="bg-white bg-opacity-80 p-4 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-md">
                                <h4 class="font-bold text-purple-800 mb-3 flex items-center">
                                    ${this.getConditionIcon(condition)} ${this.getConditionName(condition)}
                                </h4>
                                <div class="grid grid-cols-1 gap-2">
                                    ${this.getConditionSymptoms(condition).map(symptom => `
                                        <label class="flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                                            <input type="checkbox" name="condition_symptoms" value="${condition}_${symptom.id}" class="text-purple-500 rounded focus:ring-2 focus:ring-purple-300">
                                            <span class="text-sm font-medium text-purple-700">${symptom.icon} ${symptom.name}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-xl border border-purple-200">
                        <div class="text-center">
                            <div class="text-2xl mb-1">📊</div>
                            <div class="text-xs font-bold text-purple-800">${userConditions.length} Condition${userConditions.length !== 1 ? 's' : ''} Tracked</div>
                            <div class="text-xs text-purple-600">Personalized for you</div>
                        </div>
                    </div>
                </div>
            `;
        }

        getConditionIcon(condition) {
            const icons = {
                'epilepsy': '🧠',
                'autism': '🌟',
                'diabetes': '🩸',
                'mental_health': '🧠',
                'chronic_pain': '😣',
                'heart_condition': '❤️',
                'respiratory': '🫁',
                'autoimmune': '🛡️',
                'neurological': '🧠',
                'gastrointestinal': '🫃'
            };
            return icons[condition] || '🏥';
        }

        getConditionName(condition) {
            const names = {
                'epilepsy': 'Epilepsy',
                'autism': 'Autism Spectrum',
                'diabetes': 'Diabetes',
                'mental_health': 'Mental Health',
                'chronic_pain': 'Chronic Pain',
                'heart_condition': 'Heart Condition',
                'respiratory': 'Respiratory',
                'autoimmune': 'Autoimmune',
                'neurological': 'Neurological',
                'gastrointestinal': 'Gastrointestinal'
            };
            return names[condition] || condition;
        }

        getConditionSymptoms(condition) {
            const symptoms = {
                'epilepsy': [
                    { id: 'aura', name: 'Aura/Warning signs', icon: '⚡' },
                    { id: 'confusion', name: 'Confusion', icon: '😵' },
                    { id: 'memory_loss', name: 'Memory issues', icon: '🧠' },
                    { id: 'muscle_jerking', name: 'Muscle jerking', icon: '💪' }
                ],
                'diabetes': [
                    { id: 'high_blood_sugar', name: 'High blood sugar', icon: '📈' },
                    { id: 'low_blood_sugar', name: 'Low blood sugar', icon: '📉' },
                    { id: 'excessive_thirst', name: 'Excessive thirst', icon: '🥤' },
                    { id: 'frequent_urination', name: 'Frequent urination', icon: '🚽' }
                ]
            };
            return symptoms[condition] || [];
        }

        generateGeneralSymptomsHTML() {
            return `
                <div class="bg-gradient-to-r from-amber-500 to-orange-600 p-5 rounded-2xl shadow-lg">
                    <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                        <span class="text-2xl mr-3">🌡️</span>
                        General symptoms experienced
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${this.getGeneralSymptoms().map(symptom => `
                            <label class="flex items-center space-x-2 p-3 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 cursor-pointer transition-all duration-300 transform hover:scale-105">
                                <input type="checkbox" name="symptoms" value="${symptom.id}" class="text-orange-500 rounded focus:ring-2 focus:ring-orange-300">
                                <span class="text-sm font-medium text-orange-800">${symptom.icon} ${symptom.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        getGeneralSymptoms() {
            return [
                { id: 'headache', name: 'Headache', icon: '🤕' },
                { id: 'nausea', name: 'Nausea', icon: '🤢' },
                { id: 'dizziness', name: 'Dizziness', icon: '😵' },
                { id: 'fatigue', name: 'Fatigue', icon: '😴' },
                { id: 'fever', name: 'Fever', icon: '🌡️' },
                { id: 'chills', name: 'Chills', icon: '🥶' },
                { id: 'sweating', name: 'Sweating', icon: '💦' },
                { id: 'breathing_difficulty', name: 'Breathing Issues', icon: '🫁' },
                { id: 'chest_pain', name: 'Chest Pain', icon: '💔' },
                { id: 'abdominal_pain', name: 'Stomach Pain', icon: '🫃' },
                { id: 'muscle_pain', name: 'Muscle Pain', icon: '💪' },
                { id: 'joint_pain', name: 'Joint Pain', icon: '🦴' }
            ];
        }

        generateSeverityHTML() {
            return `
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
            `;
        }

        generateNotesHTML() {
            return `
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
            `;
        }

        generateActionButtonsHTML() {
            return `
                <div class="flex justify-between items-center pt-6 border-t-2 border-gray-200">
                    <button type="button" 
                            id="cancel-record-btn"
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
            `;
        }

        setupRecordFormListeners() {
            console.log('Setting up record form listeners');

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

            incidentCards.forEach(card => {
                card.addEventListener('click', () => {
                    incidentCards.forEach(c => c.classList.remove('border-indigo-500', 'bg-indigo-50'));
                    card.classList.add('border-indigo-500', 'bg-indigo-50');
                    selectedTypeInput.value = card.dataset.type;
                });
            });

            // Cancel button
            const cancelBtn = document.getElementById('cancel-record-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    window.hideModal();
                });
            }

            // Form submission
            const form = document.getElementById('add-record-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSubmit(e);
                });
            }
        }

        handleSubmit(e) {
            const formData = new FormData(e.target);
            const symptoms = [];

            // Collect general symptoms
            const generalSymptoms = formData.getAll('symptoms');
            symptoms.push(...generalSymptoms);

            // Collect condition-specific symptoms
            const conditionSymptoms = formData.getAll('condition_symptoms');
            symptoms.push(...conditionSymptoms);

            const recordData = {
                id: Date.now().toString(),
                type: formData.get('incidentType'),
                datetime: formData.get('datetime'),
                location: formData.get('location'),
                symptoms: symptoms,
                severity: parseInt(formData.get('severity')),
                notes: formData.get('notes'),
                createdAt: new Date().toISOString()
            };

            // Save the record
            this.dataManager.addMedicalRecord(recordData);

            window.hideModal();
            window.showStatusMessage('Medical record saved successfully!', 'success');

            // Refresh profile data if function exists
            if (window.refreshProfileData) {
                window.refreshProfileData();
            }
        }
    }

    // Initialize medical records manager
    const medicalRecordsManager = new ProfileMedicalRecordsManager();

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

    // Function to update main profile picture
    function updateMainProfilePicture(userData, displayName) {
        const mainProfilePic = document.getElementById('main-profile-pic');
        const mainAvatar = document.getElementById('main-avatar');

        if (!mainProfilePic || !mainAvatar) return; // Elements don't exist yet

        const profilePictureUrl = userData?.userProfile?.profilePicture?.url || userData?.profilePicture?.url;

        if (profilePictureUrl) {
            // Show profile picture if available
            mainProfilePic.src = profilePictureUrl;
            mainProfilePic.classList.remove('hidden');
            mainAvatar.classList.add('hidden');
        } else if (displayName) {
            // Fall back to avatar initial if no profile picture
            const initial = displayName.charAt(0).toUpperCase();
            mainAvatar.textContent = initial;
            mainAvatar.classList.remove('hidden');
            mainProfilePic.classList.add('hidden');
        }
    }

    // Initialize enhanced data manager for profile
    enhancedDataManager.onStatusMessage((message, type) => {
        showStatusMessage(message, type);
    });

    // Function to update profile picture with fallback
    function updateUserProfilePicture(displayName) {
        const userProfilePic = document.getElementById('user-profile-pic');
        const userAvatar = document.getElementById('user-avatar');
        const userDisplayName = document.getElementById('user-display-name');
        const userEmailDisplay = document.getElementById('user-email-display');

        // Get user data to check for profile picture
        const userData = enhancedDataManager.getData();
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

        // Update user display info in header
        if (userDisplayName && currentUser) {
            userDisplayName.textContent = displayName;
            userDisplayName.classList.remove('hidden');
        }
        if (userEmailDisplay && currentUser && currentUser.email) {
            userEmailDisplay.textContent = currentUser.email;
            userEmailDisplay.classList.remove('hidden');
        }
    }

    // Auth state change handler
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            if (personalGreeting) {
                personalGreeting.textContent = `Welcome back, ${user.displayName || user.email || 'User'}`;
            }
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
            const onboardingCompleted = await enhancedDataManager.loadUserData();
            currentUserData = enhancedDataManager.getData();

            if (!currentUserData.hospitals || currentUserData.hospitals.length === 0) {
                console.log('No hospital data found, initializing default data...');
                await enhancedDataManager.initializeDefaultData();
                currentUserData = enhancedDataManager.getData();
            }

            const hasExistingData = currentUserData.hospitals && currentUserData.hospitals.length > 0;
            const hasConditions = currentUserData.conditions && currentUserData.conditions.length > 0;
            const hasMedicalRecords = currentUserData.medicalRecords && currentUserData.medicalRecords.length > 0;

            if (isOnboarding && (!onboardingCompleted || (!hasExistingData && !hasConditions && !hasMedicalRecords))) {
                showOnboardingModal();
            } else {
                if (profileContent) {
                    profileContent.classList.remove('hidden');
                    renderProfileTabs();
                    renderFullProfile(currentUserData, user);
                }
            }

                // Update profile picture after data is loaded
                const displayName = user.displayName || user.email || (user.isAnonymous ? 'Guest User' : 'Anonymous');
                updateUserProfilePicture(displayName);
                updateMainProfilePicture(currentUserData, displayName);

                // Initialize profile picture uploader after content is rendered
                setTimeout(() => {
                    if (window.ProfilePictureUploader) {
                        new window.ProfilePictureUploader();
                    }
                }, 100);

                // Check for admin access after successful login
                adminAccessManager.checkAdminAccess(user);

            } catch (error) {
                console.error('Error loading user data:', error);
                showStatusMessage('Error loading profile data', 'error');

                // Try to initialize default data as fallback
                await enhancedDataManager.initializeDefaultData();
                currentUserData = enhancedDataManager.getData();
                if (profileContent) {
                    profileContent.classList.remove('hidden');
                    renderProfileTabs();
                    renderFullProfile(currentUserData, user);
                }

                // Update profile picture even in error case
                const displayName = user.displayName || user.email || (user.isAnonymous ? 'Guest User' : 'Anonymous');
                updateUserProfilePicture(displayName);
                updateMainProfilePicture(currentUserData, displayName);
            } finally {
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            }

        } else {
            if (notSignedInDiv) notSignedInDiv.classList.remove('hidden');
            if (profileContent) profileContent.classList.add('hidden');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
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
            console.log('Add Record button clicked from profile');
            medicalRecordsManager.showAddRecordModal();
        });
    }

    // Set up medical records manager with data manager
    medicalRecordsManager.setDataManager(enhancedDataManager);

    // Profile rendering functions
    function renderProfileTabs() {
        const profileContent = document.getElementById('profile-content');
        if (!profileContent) return;

        profileContent.innerHTML = `
            <!-- Profile Header and Stats -->
            <div id="profile-header-and-stats"></div>
            
            <!-- Profile Tabs -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100">
                <!-- Tab Navigation -->
                <div class="flex flex-wrap border-b border-gray-200 px-6">
                    <button class="profile-tab-btn active border-purple-500 text-purple-600 px-6 py-3 rounded-t-lg font-medium mr-2" data-tab="overview">
                        Overview
                    </button>
                    <button class="profile-tab-btn border-transparent text-gray-500 hover:text-gray-700 px-6 py-3 rounded-t-lg font-medium mr-2" data-tab="conditions">
                        Conditions
                    </button>
                    <button class="profile-tab-btn border-transparent text-gray-500 hover:text-gray-700 px-6 py-3 rounded-t-lg font-medium mr-2" data-tab="records">
                        Records
                    </button>
                    <button class="profile-tab-btn border-transparent text-gray-500 hover:text-gray-700 px-6 py-3 rounded-t-lg font-medium mr-2" data-tab="symptoms">
                        Symptom Tracker
                    </button>
                    <button class="profile-tab-btn border-transparent text-gray-500 hover:text-gray-700 px-6 py-3 rounded-t-lg font-medium" data-tab="analytics">
                        Analytics
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div id="profile-tab-content" class="p-6">
                    <!-- Content will be dynamically inserted here -->
                </div>
            </div>
        `;
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

        // Update main profile picture after header is rendered
        setTimeout(() => {
            // Import and initialize the profile picture uploader
            import('./profilePictureUpload.js').then(() => {
                console.log('✅ Profile picture uploader module loaded');
                // The uploader will initialize itself via DOM ready event
            }).catch(error => {
                console.error('❌ Failed to load profile picture uploader:', error);
            });
        }, 100);
    }

    function renderProfileHeader(userData, user, joinDate, daysSinceJoin, stats) {
        const headerContainer = document.getElementById('profile-header-and-stats');
        if (!headerContainer) return;

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
                            <!-- Profile Picture with Upload Capability -->
                            <div class="relative">
                                <div class="profile-pic-container w-24 h-24 bg-gradient-to-br from-white to-blue-100 rounded-full flex items-center justify-center text-4xl font-bold text-purple-600 shadow-xl border-4 border-white/30 cursor-pointer relative overflow-hidden" id="main-profile-pic-container">
                                    <img id="main-profile-pic" class="w-full h-full object-cover rounded-full hidden" alt="Profile Picture">
                                    <span id="main-avatar">${displayName.charAt(0).toUpperCase()}</span>
                                    <div class="profile-pic-overlay absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                        <span class="text-white text-xs text-center">📷<br>Edit</span>
                                    </div>
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
                
                <!-- Ambulance Services Card -->
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
        if (!content) return;

        const medicalRecords = userData.medicalRecords || [];
        const recentRecords = medicalRecords.slice(-5).reverse();

        // Fix: Get conditions from the right place in the data structure
        const conditions = userData.conditions || userData.userProfile?.conditions || [];

        console.log('Rendering overview with conditions:', conditions);
        console.log('Full userData:', userData);

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
                            <button onclick="document.getElementById('edit-profile-btn').click()" class="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                Add Conditions
                            </button>
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    function renderConditionsTab(userData) {
        const content = document.getElementById('profile-tab-content');
        if (!content) return;

        // Fix: Get conditions from the right place in the data structure
        const conditions = userData.conditions || userData.userProfile?.conditions || [];

        console.log('Rendering conditions tab with:', conditions);

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

    function showOnboardingModal() {
        // Get existing conditions to pre-select them
        const existingConditions = currentUserData?.conditions || currentUserData?.userProfile?.conditions || [];

        console.log('Showing onboarding modal with existing conditions:', existingConditions);

        const modalContent = `
            <div class="onboarding-gradient text-white p-4 rounded-t-xl">
                <div class="text-center">
                    <div class="text-2xl mb-2">🏥</div>
                    <h2 class="text-lg font-bold mb-1">Welcome to Health Overview!</h2>
                    <p class="text-purple-100 text-sm">Let's set up your health tracking profile</p>
                </div>
            </div>
            
            <form id="onboarding-form">
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
                                           value="${currentUserData?.displayName || currentUserData?.userProfile?.displayName || currentUser?.displayName || ''}"
                                           class="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:border-purple-500"
                                           placeholder="How should we address you?">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">🚨 Emergency Contact</label>
                                    <input type="text" 
                                           id="emergency-contact" 
                                           name="emergencyContact"
                                           value="${currentUserData?.emergencyContact || currentUserData?.userProfile?.emergencyContact || ''}"
                                           class="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:border-purple-500"
                                           placeholder="Optional">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 mb-1">📝 Medical Notes</label>
                                    <textarea id="medical-notes" 
                                              name="medicalNotes"
                                              rows="2"
                                              class="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:border-purple-500"
                                              placeholder="Allergies, important info...">${currentUserData?.medicalNotes || currentUserData?.userProfile?.medicalNotes || ''}</textarea>
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
                                    <input type="checkbox" name="consent" class="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded focus:ring-green-500">
                                    <span class="text-xs text-green-800">I consent to secure data storage</span>
                                </label>
                                <label class="flex items-start space-x-1">
                                    <input type="checkbox" name="analytics" class="mt-0.5 h-3 w-3 text-green-600 border-gray-300 rounded focus:ring-green-500">
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
                                    <div class="onboarding-condition-card p-2 rounded-lg cursor-pointer mb-1.5 ${existingConditions.includes(condition.id) ? 'selected' : ''}" 
                                         data-condition="${condition.id}">
                                        <div class="flex items-center space-x-2">
                                            <div class="text-sm">${condition.icon}</div>
                                            <div class="flex-1 min-w-0">
                                                <h4 class="font-medium text-gray-800 text-xs leading-tight">${condition.name}</h4>
                                                <p class="text-xs text-gray-600 leading-tight">${condition.description}</p>
                                            </div>
                                            <div class="condition-checkbox ${existingConditions.includes(condition.id) ? '' : 'hidden'}">
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

        // Initialize with existing conditions
        const existingConditions = currentUserData?.conditions || currentUserData?.userProfile?.conditions || [];
        let selectedConditions = new Set(existingConditions);

        console.log('Initializing onboarding with existing conditions:', existingConditions);

        // Handle condition selection
        conditionCards.forEach(card => {
            const conditionId = card.dataset.condition;

            // Add click handler for condition selection
            card.addEventListener('click', () => {
                const checkbox = card.querySelector('.condition-checkbox');

                if (selectedConditions.has(conditionId)) {
                    // Deselect condition
                    selectedConditions.delete(conditionId);
                    card.classList.remove('selected');
                    if (checkbox) {
                        checkbox.classList.add('hidden');
                    }
                } else {
                    // Select condition
                    selectedConditions.add(conditionId);
                    card.classList.add('selected');
                    if (checkbox) {
                        checkbox.classList.remove('hidden');
                    }
                }

                console.log('Condition selection changed:', Array.from(selectedConditions));
            });
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted with conditions:', Array.from(selectedConditions));
            await completeOnboarding(selectedConditions);
        });

        // Handle skip button
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

            // Get current data to preserve existing information
            const currentData = enhancedDataManager.getData();

            const userData = {
                displayName: formData.get('displayName') || currentUser?.displayName || 'User',
                emergencyContact: formData.get('emergencyContact') || '',
                medicalNotes: formData.get('medicalNotes') || '',
                conditions: Array.from(selectedConditions), // Save as array
                onboardingCompleted: true,
                onboardingDate: new Date().toISOString(),
                profileSetupDate: new Date().toISOString()
            };

            // Update the data structure correctly
            const updatedData = {
                ...currentData,
                userProfile: userData,
                conditions: Array.from(selectedConditions), // Also save at root level for compatibility
                onboardingCompleted: true
            };

            // Set the data in the data manager
            enhancedDataManager.setData(updatedData);

            // Save to Firestore
            await enhancedDataManager.saveData();

            // Update current user data reference
            currentUserData = enhancedDataManager.getData();

            console.log('Onboarding completed with conditions:', Array.from(selectedConditions));
            console.log('Saved data structure:', updatedData);

            hideModal();
            showStatusMessage('Profile setup completed successfully! Refreshing profile...', 'success');

            // Clear the onboarding parameter from URL
            const url = new URL(window.location);
            url.searchParams.delete('onboarding');
            window.history.replaceState({}, '', url);

            // Refresh the profile display
            if (profileContent) {
                profileContent.classList.remove('hidden');
                renderProfileTabs();
                renderFullProfile(currentUserData, currentUser);
            }

        } catch (error) {
            console.error('Error completing onboarding:', error);
            showStatusMessage('Error saving profile. Please try again.', 'error');
        }
    }

    // Add the CSS styles for onboarding - UPDATE THIS SECTION
    const onboardingStyles = document.createElement('style');
    onboardingStyles.textContent = `
        .onboarding-condition-card.selected {
            border-color: #8b5cf6 !important;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
        }
        
        .onboarding-condition-card.selected h4 {
            color: #7c3aed;
        }
        
        /* Scrollable conditions area */
        .onboarding-conditions-scroll {
            max-height: 200px;
            overflow-y: auto;
            padding-right: 4px;
            margin-right: -4px;
        }
        
        /* Custom scrollbar for conditions area */
        .onboarding-conditions-scroll::-webkit-scrollbar {
            width: 6px;
        }
        
        .onboarding-conditions-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
        }
        
        .onboarding-conditions-scroll::-webkit-scrollbar-thumb {
            background: #a78bfa;
            border-radius: 3px;
        }
        
        .onboarding-conditions-scroll::-webkit-scrollbar-thumb:hover {
            background: #8b5cf6;
        }
        
        /* Custom scrollbar for medical records modal */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #a78bfa;
            border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #8b5cf6;
        }
        
        /* Onboarding modal styles */
        .onboarding-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 1rem 1rem 0 0;
        }
        
        .onboarding-user-info {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 0.75rem;
        }
        
        .onboarding-condition-card {
            background: linear-gradient(135deg, #fafbff 0%, #f1f5f9 100%);
            border: 1px solid transparent;
            border-radius: 0.75rem;
            transition: all 0.2s ease;
        }
        
        .onboarding-condition-card:hover {
            border-color: #c7d2fe;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
        }
        
        .privacy-card {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 1px solid #bbf7d0;
            border-radius: 0.75rem;
        }
        
        /* Profile tab styling */
        .profile-tab-btn {
            transition: all 0.2s ease;
        }
        
        .profile-tab-btn.active {
            border-color: #8b5cf6;
            color: #7c3aed;
            background-color: #f3f4f6;
        }
    `;

    // Add styles to head if not already present
    if (!document.getElementById('onboarding-styles')) {
        onboardingStyles.id = 'onboarding-styles';
        document.head.appendChild(onboardingStyles);
    }

    // Add global refresh function
    window.refreshProfileData = function () {
        if (currentUserData && currentUser) {
            renderFullProfile(currentUserData, currentUser);
        }
    };

}); // Close DOMContentLoaded event handler