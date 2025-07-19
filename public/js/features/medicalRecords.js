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
        const modalContent = `
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span class="text-2xl">🏥</span>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">Add Medical Record</h2>
                        <p class="text-blue-100">Track your health incidents and symptoms</p>
                    </div>
                </div>
            </div>
            
            <div class="p-6 max-h-[70vh] overflow-y-auto">
                <form id="add-record-form" class="space-y-6">
                    <!-- Incident Type Selection -->
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span class="text-xl mr-2">🚨</span>
                            Incident Type
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="incident-types">
                            <div class="incident-type-card p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all" data-type="emergency">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">🚑</div>
                                    <div class="text-sm font-medium text-gray-700">Emergency</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all" data-type="appointment">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">📅</div>
                                    <div class="text-sm font-medium text-gray-700">Appointment</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all" data-type="symptom">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">🩺</div>
                                    <div class="text-sm font-medium text-gray-700">Symptom Log</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all" data-type="medication">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">💊</div>
                                    <div class="text-sm font-medium text-gray-700">Medication</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all" data-type="test">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">🧪</div>
                                    <div class="text-sm font-medium text-gray-700">Test Result</div>
                                </div>
                            </div>
                            <div class="incident-type-card p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-all" data-type="other">
                                <div class="text-center">
                                    <div class="text-2xl mb-1">📝</div>
                                    <div class="text-sm font-medium text-gray-700">Other</div>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="selected-type" name="incidentType" required>
                    </div>

                    <!-- Basic Information -->
                    <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span class="text-xl mr-2">📋</span>
                            Basic Information
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                <input type="datetime-local" 
                                       name="datetime" 
                                       value="${new Date().toISOString().slice(0, 16)}"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                       required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input type="text" 
                                       name="location" 
                                       placeholder="Hospital, clinic, home..."
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                            </div>
                        </div>
                    </div>

                    <!-- Condition-Specific Symptoms -->
                    <div id="condition-symptoms-section" class="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 hidden">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span class="text-xl mr-2">🧠</span>
                            Condition-Specific Symptoms
                        </h3>
                        <div id="condition-symptoms-content"></div>
                    </div>

                    <!-- General Symptoms -->
                    <div class="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span class="text-xl mr-2">🌡️</span>
                            General Symptoms
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3" id="general-symptoms">
                            ${this.getGeneralSymptoms().map(symptom => `
                                <label class="flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-100 cursor-pointer">
                                    <input type="checkbox" name="symptoms" value="${symptom.id}" class="text-orange-500 rounded">
                                    <span class="text-sm">${symptom.icon} ${symptom.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Severity Scale -->
                    <div class="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span class="text-xl mr-2">📊</span>
                            Severity & Impact
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Pain/Discomfort Level (1-10)</label>
                                <input type="range" name="severity" min="1" max="10" value="5" 
                                       class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                       onchange="updateSeverityLabel(this.value)">
                                <div class="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>1 - Minimal</span>
                                    <span id="severity-label" class="font-medium">5 - Moderate</span>
                                    <span>10 - Severe</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Impact on Daily Activities</label>
                                <select name="impact" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                    <option value="none">No impact</option>
                                    <option value="minimal">Minimal impact</option>
                                    <option value="moderate">Moderate impact</option>
                                    <option value="significant">Significant impact</option>
                                    <option value="severe">Unable to function normally</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Notes -->
                    <div class="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <span class="text-xl mr-2">📝</span>
                            Additional Notes
                        </h3>
                        <textarea name="notes" 
                                  rows="4" 
                                  placeholder="Describe what happened, triggers, treatments used, how you felt..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                        <button type="button" 
                                onclick="hideModal()"
                                class="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium">
                            Save Record
                        </button>
                    </div>
                </form>
            </div>

            <script>
                // Make hideModal available globally for onclick handlers
                window.hideModal = () => {
                    const modal = document.getElementById('modal-backdrop');
                    if (modal) modal.remove();
                };

                // Severity label update function
                window.updateSeverityLabel = (value) => {
                    const labels = {
                        1: '1 - Minimal', 2: '2 - Mild', 3: '3 - Mild', 4: '4 - Moderate', 5: '5 - Moderate',
                        6: '6 - Moderate', 7: '7 - Severe', 8: '8 - Severe', 9: '9 - Very Severe', 10: '10 - Unbearable'
                    };
                    document.getElementById('severity-label').textContent = labels[value] || value;
                };
            </script>
        `;

        showModal(modalContent, false);
        this.setupRecordFormListeners();
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

    // Setup medical record form event handlers
    setupRecordFormListeners() {
        // Incident type selection
        const incidentCards = document.querySelectorAll('.incident-type-card');
        const selectedTypeInput = document.getElementById('selected-type');
        const conditionSymptomsSection = document.getElementById('condition-symptoms-section');

        incidentCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selection
                incidentCards.forEach(c => c.classList.remove('border-blue-500', 'bg-blue-50'));
                
                // Add selection to clicked card
                card.classList.add('border-blue-500', 'bg-blue-50');
                selectedTypeInput.value = card.dataset.type;

                // Show condition-specific symptoms for symptom logs
                if (card.dataset.type === 'symptom') {
                    conditionSymptomsSection.classList.remove('hidden');
                    this.loadConditionSpecificSymptoms();
                } else {
                    conditionSymptomsSection.classList.add('hidden');
                }
            });
        });

        // Form submission
        const form = document.getElementById('add-record-form');
        form.addEventListener('submit', this.handleRecordSubmission.bind(this));
    }

    // Load condition-specific symptoms based on user's conditions
    loadConditionSpecificSymptoms() {
        // This would load based on user's tracked conditions
        const conditionSymptomsContent = document.getElementById('condition-symptoms-content');
        
        // Example for epilepsy - you'd load this based on user's actual conditions
        conditionSymptomsContent.innerHTML = `
            <div class="space-y-4">
                <div class="p-3 bg-purple-100 rounded-lg">
                    <h4 class="font-medium text-purple-800 mb-2">🧠 Epilepsy Symptoms</h4>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" name="epilepsy_symptoms" value="aura" class="text-purple-500 rounded">
                            <span class="text-sm">Aura/Warning signs</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" name="epilepsy_symptoms" value="confusion" class="text-purple-500 rounded">
                            <span class="text-sm">Confusion</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" name="epilepsy_symptoms" value="memory_loss" class="text-purple-500 rounded">
                            <span class="text-sm">Memory loss</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" name="epilepsy_symptoms" value="muscle_jerking" class="text-purple-500 rounded">
                            <span class="text-sm">Muscle jerking</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
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
        const epilepsySymptoms = formData.getAll('epilepsy_symptoms');
        symptoms.push(...epilepsySymptoms);
        
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
        
        // Save the record (you'll need to implement this in your data manager)
        console.log('Saving medical record:', recordData);
        
        hideModal();
        showStatusMessage('Medical record saved successfully!', 'success');
    }
}

// Create and export singleton instance
export const medicalRecordsManager = new MedicalRecordsManager();
