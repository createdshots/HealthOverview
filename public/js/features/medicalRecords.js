// Medical Records management system
import { showModal, hideModal } from '../components/modal.js';
import { showStatusMessage } from '../utils/ui.js';

export class MedicalRecordsManager {
    constructor() {
        this.dataManager = null;
    }

    // Set data manager reference
    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    // Show add medical record modal
    showAddRecordModal() {
        if (!this.dataManager) {
            showStatusMessage('Data manager not initialized', 'error');
            return;
        }

        const data = this.dataManager.getData();
        const hospitalOptions = (data.hospitals || []).map(h => 
            `<option value="${h.name}">${h.name}</option>`
        ).join('');
        
        const ambulanceOptions = (data.ambulance || []).map(a => 
            `<option value="${a.name}">${a.name}</option>`
        ).join('');

        const userConditions = data.userProfile?.conditions || [];
        const conditionSymptomsHTML = this.generateConditionSymptomsHTML(userConditions);
        const generalSymptomsHTML = this.generateGeneralSymptomsHTML();

        const modalContent = `
            <div class="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white p-6 rounded-t-2xl relative overflow-hidden">
                <div class="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
                <div class="relative flex items-center space-x-4">
                    <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-lg">
                        <span class="text-3xl">🏥</span>
                    </div>
                    <div>
                        <h2 class="text-3xl font-bold mb-1">Medical Incident Tracker</h2>
                        <p class="text-blue-100 text-lg">Record symptoms, visits, and health events</p>
                    </div>
                    <div class="ml-auto flex space-x-2">
                        <div class="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                        <div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                        <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-0 max-h-[75vh]">
                <!-- Left Column: Main Form -->
                <div class="lg:col-span-2 p-6 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
                    <form id="add-record-form" class="space-y-6">
                        ${this.generateIncidentTypeHTML()}
                        ${this.generateBasicInfoHTML(hospitalOptions, ambulanceOptions)}
                        ${generalSymptomsHTML}
                        ${this.generateSeverityHTML()}
                        ${this.generateNotesHTML()}
                        ${this.generateActionButtonsHTML()}
                    </form>
                </div>
                
                <!-- Right Column: Condition-Specific Symptoms -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 overflow-y-auto border-l border-purple-200">
                    ${this.generateConditionSymptomsPanel(userConditions)}
                </div>
            </div>

            <script>
                window.updateSeverityLabel = (value) => {
                    const labels = {
                        1: '1 - Minimal', 2: '2 - Mild', 3: '3 - Mild', 4: '4 - Moderate', 5: '5 - Moderate',
                        6: '6 - Moderate', 7: '7 - Severe', 8: '8 - Severe', 9: '9 - Very Severe', 10: '10 - Unbearable'
                    };
                    const label = document.getElementById('severity-label');
                    if (label) label.textContent = labels[value] || value;
                };
            </script>
        `;

        showModal(modalContent, false);
        this.setupRecordFormListeners();

        // Adjust modal size for new layout
        const modal = document.querySelector('#modal-backdrop .bg-white');
        if (modal) {
            modal.classList.remove('max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl');
            modal.classList.add('max-w-7xl', 'w-full', 'mx-4');
        }
    }

    // Get general symptoms list
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

    // Generate incident type HTML
    generateIncidentTypeHTML() {
        return `
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-lg transform hover:scale-[1.02] transition-all duration-300">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <span class="text-2xl mr-3 animate-bounce">🚨</span>
                    What happened?
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    <div class="incident-type-card group p-4 bg-white bg-opacity-90 hover:bg-opacity-100 border-3 border-transparent rounded-xl cursor-pointer hover:border-red-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg" data-type="emergency">
                        <div class="text-center">
                            <div class="text-3xl mb-2 group-hover:animate-pulse">🚑</div>
                            <div class="text-sm font-bold text-red-700 group-hover:text-red-800">Emergency</div>
                            <div class="text-xs text-red-500 mt-1">Urgent medical care</div>
                        </div>
                    </div>
                    <div class="incident-type-card group p-4 bg-white bg-opacity-90 hover:bg-opacity-100 border-3 border-transparent rounded-xl cursor-pointer hover:border-blue-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg" data-type="appointment">
                        <div class="text-center">
                            <div class="text-3xl mb-2 group-hover:animate-pulse">📅</div>
                            <div class="text-sm font-bold text-blue-700 group-hover:text-blue-800">Appointment</div>
                            <div class="text-xs text-blue-500 mt-1">Scheduled visit</div>
                        </div>
                    </div>
                    <div class="incident-type-card group p-4 bg-white bg-opacity-90 hover:bg-opacity-100 border-3 border-transparent rounded-xl cursor-pointer hover:border-green-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg" data-type="symptom">
                        <div class="text-center">
                            <div class="text-3xl mb-2 group-hover:animate-pulse">🩺</div>
                            <div class="text-sm font-bold text-green-700 group-hover:text-green-800">Symptom Log</div>
                            <div class="text-xs text-green-500 mt-1">Track symptoms</div>
                        </div>
                    </div>
                    <div class="incident-type-card group p-4 bg-white bg-opacity-90 hover:bg-opacity-100 border-3 border-transparent rounded-xl cursor-pointer hover:border-orange-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg" data-type="medication">
                        <div class="text-center">
                            <div class="text-3xl mb-2 group-hover:animate-pulse">💊</div>
                            <div class="text-sm font-bold text-orange-700 group-hover:text-orange-800">Medication</div>
                            <div class="text-xs text-orange-500 mt-1">Prescription event</div>
                        </div>
                    </div>
                    <div class="incident-type-card group p-4 bg-white bg-opacity-90 hover:bg-opacity-100 border-3 border-transparent rounded-xl cursor-pointer hover:border-teal-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg" data-type="test">
                        <div class="text-center">
                            <div class="text-3xl mb-2 group-hover:animate-pulse">🧪</div>
                            <div class="text-sm font-bold text-teal-700 group-hover:text-teal-800">Test Result</div>
                            <div class="text-xs text-teal-500 mt-1">Lab or scan results</div>
                        </div>
                    </div>
                    <div class="incident-type-card group p-4 bg-white bg-opacity-90 hover:bg-opacity-100 border-3 border-transparent rounded-xl cursor-pointer hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-lg" data-type="other">
                        <div class="text-center">
                            <div class="text-3xl mb-2 group-hover:animate-pulse">📝</div>
                            <div class="text-sm font-bold text-gray-700 group-hover:text-gray-800">Other</div>
                            <div class="text-xs text-gray-500 mt-1">Custom entry</div>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="selected-type" name="incidentType" required>
                <div id="type-validation" class="mt-2 text-red-200 text-sm hidden">Please select an incident type</div>
            </div>
        `;
    }

    // Generate basic info HTML
    generateBasicInfoHTML(hospitalOptions, ambulanceOptions) {
        return `
            <div class="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <span class="text-2xl mr-3 animate-bounce">📋</span>
                    When & Where?
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white bg-opacity-90 p-4 rounded-xl shadow-inner">
                        <label class="block text-sm font-bold text-emerald-800 mb-2 flex items-center">
                            <span class="text-lg mr-2">🕐</span>
                            Date & Time
                        </label>
                        <input type="datetime-local" 
                               name="datetime" 
                               value="${new Date().toISOString().slice(0, 16)}"
                               class="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500 transition-all duration-300 bg-white"
                               required>
                    </div>
                    <div class="bg-white bg-opacity-90 p-4 rounded-xl shadow-inner">
                        <label class="block text-sm font-bold text-emerald-800 mb-2 flex items-center">
                            <span class="text-lg mr-2">📍</span>
                            Location
                        </label>
                        <select name="location" class="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-300 focus:border-emerald-500 transition-all duration-300 bg-white">
                            <option value="">🏥 Select location...</option>
                            <optgroup label="🏥 Hospitals">
                                ${hospitalOptions}
                            </optgroup>
                            <optgroup label="🚑 Ambulance Services">
                                ${ambulanceOptions}
                            </optgroup>
                            <option value="home">🏠 Home</option>
                            <option value="other">📍 Other location</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate condition-specific symptoms panel for right column
    generateConditionSymptomsPanel(userConditions) {
        if (!userConditions || userConditions.length === 0) {
            return `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4 opacity-50">🧠</div>
                    <h3 class="text-lg font-semibold text-gray-600 mb-2">No Tracked Conditions</h3>
                    <p class="text-sm text-gray-500 mb-4">Add medical conditions in your profile to see condition-specific symptom tracking here.</p>
                    <div class="bg-purple-100 border border-purple-200 rounded-lg p-4 text-left">
                        <h4 class="font-medium text-purple-800 mb-2">💡 Tip</h4>
                        <p class="text-sm text-purple-600">Tracking condition-specific symptoms helps you and your healthcare providers identify patterns and triggers more effectively.</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="sticky top-0">
                <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl mb-4 shadow-lg">
                    <h3 class="text-lg font-bold text-white flex items-center">
                        <span class="text-2xl mr-3 animate-pulse">🧠</span>
                        Your Conditions
                    </h3>
                    <p class="text-purple-100 text-sm mt-1">Track symptoms specific to your medical conditions</p>
                </div>
                
                <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2" style="scrollbar-width: thin;">
                    ${userConditions.map((condition, index) => `
                        <div class="bg-white rounded-xl shadow-md border border-purple-200 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
                            <div class="bg-gradient-to-r ${this.getConditionGradient(condition)} p-3">
                                <h4 class="font-bold text-white flex items-center">
                                    <span class="text-lg mr-2">${this.getConditionIcon(condition)}</span>
                                    ${condition}
                                </h4>
                            </div>
                            <div class="p-4">
                                <div class="space-y-2">
                                    ${this.getConditionSymptoms(condition).slice(0, 6).map(symptom => `
                                        <label class="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 cursor-pointer transition-all duration-200 group">
                                            <input type="checkbox" 
                                                   name="condition_symptoms" 
                                                   value="${condition}:${symptom}" 
                                                   class="text-purple-500 rounded focus:ring-purple-300 transform group-hover:scale-110 transition-transform">
                                            <span class="text-sm text-gray-700 group-hover:text-purple-700 transition-colors flex-1">${symptom}</span>
                                            <span class="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">✓</span>
                                        </label>
                                    `).join('')}
                                    ${this.getConditionSymptoms(condition).length > 6 ? `
                                        <div class="text-xs text-gray-500 text-center pt-2 border-t border-purple-100">
                                            +${this.getConditionSymptoms(condition).length - 6} more symptoms tracked
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-4 bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 rounded-lg p-3">
                    <h5 class="text-sm font-semibold text-indigo-800 mb-2">📊 Quick Stats</h5>
                    <div class="text-xs text-indigo-600 space-y-1">
                        <div>• ${userConditions.length} condition${userConditions.length !== 1 ? 's' : ''} tracked</div>
                        <div>• ${userConditions.reduce((sum, condition) => sum + this.getConditionSymptoms(condition).length, 0)} total symptoms available</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Get gradient class for condition
    getConditionGradient(condition) {
        const gradients = {
            'epilepsy': 'from-purple-500 to-indigo-600',
            'diabetes': 'from-red-500 to-pink-600',
            'asthma': 'from-blue-500 to-cyan-600',
            'hypertension': 'from-red-600 to-orange-600',
            'depression': 'from-gray-600 to-blue-600',
            'anxiety': 'from-yellow-500 to-orange-600',
            'arthritis': 'from-green-500 to-teal-600',
            'migraine': 'from-purple-600 to-pink-600'
        };
        return gradients[condition.toLowerCase()] || 'from-gray-500 to-gray-600';
    }

    // Generate general symptoms HTML
    generateGeneralSymptomsHTML() {
        const symptoms = this.getGeneralSymptoms();
        const symptomCategories = {
            'Pain & Discomfort': ['headache', 'chest_pain', 'abdominal_pain', 'muscle_pain', 'joint_pain'],
            'Digestive': ['nausea', 'dizziness'],
            'Systemic': ['fatigue', 'fever', 'chills', 'sweating'],
            'Respiratory': ['breathing_difficulty']
        };

        return `
            <div class="bg-gradient-to-r from-amber-500 to-orange-600 p-5 rounded-2xl shadow-lg">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <span class="text-2xl mr-3 animate-pulse">🌡️</span>
                    General Symptoms
                </h3>
                <div class="space-y-4">
                    ${Object.entries(symptomCategories).map(([category, symptomIds]) => `
                        <div class="bg-white bg-opacity-90 p-4 rounded-xl shadow-inner">
                            <h4 class="text-sm font-bold text-orange-800 mb-3 border-b border-orange-200 pb-1">${category}</h4>
                            <div class="grid grid-cols-2 gap-2">
                                ${symptomIds.map(symptomId => {
                                    const symptom = symptoms.find(s => s.id === symptomId);
                                    if (!symptom) return '';
                                    return `
                                        <label class="flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-all duration-200 group">
                                            <input type="checkbox" name="symptoms" value="${symptom.id}" class="text-orange-500 rounded focus:ring-orange-300">
                                            <span class="text-sm group-hover:text-orange-700 transition-colors">${symptom.icon} ${symptom.name}</span>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Generate severity scale HTML
    generateSeverityHTML() {
        return `
            <div class="bg-gradient-to-r from-rose-500 to-red-600 p-5 rounded-2xl shadow-lg">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <span class="text-2xl mr-3 animate-bounce">📊</span>
                    How severe is it?
                </h3>
                <div class="space-y-4">
                    <div class="bg-white bg-opacity-90 p-4 rounded-xl shadow-inner">
                        <label class="block text-sm font-bold text-rose-800 mb-3 flex items-center">
                            <span class="text-lg mr-2">🌡️</span>
                            Pain/Discomfort Level
                        </label>
                        <div class="relative">
                            <input type="range" 
                                   name="severity" 
                                   min="1" 
                                   max="10" 
                                   value="5" 
                                   class="w-full h-3 bg-gradient-to-r from-green-300 via-yellow-300 to-red-500 rounded-lg appearance-none cursor-pointer severity-slider"
                                   oninput="updateSeverityLabel(this.value)">
                            <div class="flex justify-between text-xs text-rose-600 mt-2 font-medium">
                                <span class="flex items-center"><span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>1 - Minimal</span>
                                <span id="severity-label" class="font-bold text-rose-800 bg-white px-2 py-1 rounded-full shadow">5 - Moderate</span>
                                <span class="flex items-center"><span class="w-2 h-2 bg-red-500 rounded-full mr-1"></span>10 - Severe</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white bg-opacity-90 p-4 rounded-xl shadow-inner">
                        <label class="block text-sm font-bold text-rose-800 mb-3 flex items-center">
                            <span class="text-lg mr-2">🏃‍♂️</span>
                            Impact on Daily Activities
                        </label>
                        <select name="impact" class="w-full px-4 py-3 border-2 border-rose-200 rounded-xl focus:ring-4 focus:ring-rose-300 focus:border-rose-500 transition-all duration-300 bg-white">
                            <option value="none">✅ No impact - feeling great!</option>
                            <option value="minimal">😊 Minimal impact - slight discomfort</option>
                            <option value="moderate">😐 Moderate impact - some limitations</option>
                            <option value="significant">😟 Significant impact - hard to function</option>
                            <option value="severe">😰 Unable to function normally</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate notes HTML
    generateNotesHTML() {
        return `
            <div class="bg-gradient-to-r from-slate-500 to-gray-600 p-5 rounded-2xl shadow-lg">
                <h3 class="text-xl font-bold text-white mb-4 flex items-center">
                    <span class="text-2xl mr-3 animate-pulse">📝</span>
                    Additional Details
                </h3>
                <div class="bg-white bg-opacity-90 p-4 rounded-xl shadow-inner">
                    <label class="block text-sm font-bold text-gray-800 mb-3">Tell us more about what happened...</label>
                    <textarea name="notes" 
                              rows="4" 
                              placeholder="🩺 Describe symptoms, triggers, treatments used, how you felt, what helped or made it worse..."
                              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-300 focus:border-gray-500 transition-all duration-300 bg-white resize-none"></textarea>
                    <div class="mt-2 text-xs text-gray-500 flex items-center">
                        <span class="mr-2">💡</span>
                        Include details like medication taken, environmental factors, stress levels, sleep quality, etc.
                    </div>
                </div>
            </div>
        `;
    }

    // Generate action buttons HTML
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

    // Get condition icon
    getConditionIcon(condition) {
        const icons = {
            'epilepsy': '🧠',
            'diabetes': '🩸',
            'asthma': '🫁',
            'hypertension': '❤️',
            'depression': '🧠',
            'anxiety': '😰',
            'arthritis': '🦴',
            'migraine': '🤕'
        };
        return icons[condition.toLowerCase()] || '🏥';
    }

    // Get condition-specific symptoms
    getConditionSymptoms(condition) {
        const symptoms = {
            'epilepsy': ['Aura/Warning signs', 'Confusion', 'Memory loss', 'Muscle jerking', 'Loss of consciousness'],
            'diabetes': ['High blood sugar', 'Low blood sugar', 'Frequent urination', 'Excessive thirst', 'Fatigue'],
            'asthma': ['Wheezing', 'Shortness of breath', 'Chest tightness', 'Coughing', 'Difficulty breathing'],
            'hypertension': ['Headache', 'Chest pain', 'Dizziness', 'Shortness of breath', 'Nosebleeds'],
            'depression': ['Sadness', 'Loss of interest', 'Fatigue', 'Sleep problems', 'Concentration issues'],
            'anxiety': ['Panic attacks', 'Racing heart', 'Sweating', 'Trembling', 'Feeling overwhelmed'],
            'arthritis': ['Joint pain', 'Stiffness', 'Swelling', 'Reduced range of motion', 'Joint warmth'],
            'migraine': ['Severe headache', 'Nausea', 'Light sensitivity', 'Sound sensitivity', 'Visual disturbances']
        };
        return symptoms[condition.toLowerCase()] || ['Symptom tracking', 'Pain level', 'Duration'];
    }

    // Setup medical record form event handlers
    setupRecordFormListeners() {
        // Incident type selection with enhanced visual feedback
        const incidentCards = document.querySelectorAll('.incident-type-card');
        const selectedTypeInput = document.getElementById('selected-type');
        const typeValidation = document.getElementById('type-validation');

        incidentCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selection
                incidentCards.forEach(c => {
                    c.classList.remove('border-indigo-500', 'bg-indigo-50', 'ring-4', 'ring-indigo-200');
                    c.style.transform = 'scale(1)';
                });
                
                // Add selection to clicked card with animation
                card.classList.add('border-indigo-500', 'bg-indigo-50', 'ring-4', 'ring-indigo-200');
                card.style.transform = 'scale(1.05)';
                selectedTypeInput.value = card.dataset.type;
                
                // Hide validation error
                if (typeValidation) {
                    typeValidation.classList.add('hidden');
                }

                // Add a subtle success animation
                const icon = card.querySelector('div:first-child');
                icon.style.animation = 'bounce 0.5s ease-in-out';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 500);
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('border-indigo-500')) {
                    card.style.transform = 'scale(1.02)';
                }
            });

            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('border-indigo-500')) {
                    card.style.transform = 'scale(1)';
                }
            });
        });

        // Cancel button
        const cancelBtn = document.getElementById('cancel-record-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                hideModal();
            });
        }

        // Form submission with validation
        const form = document.getElementById('add-record-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                // Validate incident type selection
                if (!selectedTypeInput.value) {
                    e.preventDefault();
                    if (typeValidation) {
                        typeValidation.classList.remove('hidden');
                    }
                    // Shake animation for unselected cards
                    incidentCards.forEach(card => {
                        card.style.animation = 'shake 0.5s ease-in-out';
                        setTimeout(() => {
                            card.style.animation = '';
                        }, 500);
                    });
                    return;
                }
                
                this.handleRecordSubmission(e);
            });
        }

        // Add CSS animations to head if not already present
        if (!document.getElementById('medical-record-animations')) {
            const style = document.createElement('style');
            style.id = 'medical-record-animations';
            style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                .severity-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #8B5CF6, #EC4899);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                
                .severity-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #8B5CF6, #EC4899);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Handle medical record form submission
    handleRecordSubmission(e) {
        e.preventDefault();
        
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
            impact: formData.get('impact'),
            notes: formData.get('notes'),
            createdAt: new Date().toISOString()
        };
        
        // Save the record
        if (this.dataManager) {
            this.dataManager.addMedicalRecord(recordData);
            showStatusMessage('Medical record saved successfully!', 'success');
        }
        
        hideModal();
    }
}

// Create and export singleton instance
export const medicalRecordsManager = new MedicalRecordsManager();
