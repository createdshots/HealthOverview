// Medical Records and Forms Management
export class MedicalRecordsManager {
    constructor() {
        this.dataManager = null;
    }

    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    createAddRecordForm() {
        if (!this.dataManager) return '';
        
        const localData = this.dataManager.getData();
        const hospitalOptions = (localData.hospitals || []).map(h =>
            `<option value="${h.name}">${h.name}${h.city ? ` - ${h.city}` : ''}</option>`
        ).join('');
        
        const ambulanceOptions = (localData.ambulance || []).map(a =>
            `<option value="${a.name}">${a.name}</option>`
        ).join('');
        
        const userConditions = localData.userProfile?.conditions || [];
        const conditionQuestions = this.generateConditionQuestionsForRecord(userConditions);
        
        return `
            <form id="add-record-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Left Column: Main Visit Info -->
                    <div class="space-y-4">
                        <div>
                            <label for="visit-date" class="block text-sm font-medium text-gray-700 mb-2">Visit Date</label>
                            <input type="date" id="visit-date" required
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label for="visit-time" class="block text-sm font-medium text-gray-700 mb-2">Visit Time (Optional)</label>
                            <input type="time" id="visit-time"
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                        </div>
                        <div>
                            <label for="hospital-select" class="block text-sm font-medium text-gray-700 mb-2">Hospital/Medical Facility</label>
                            <select id="hospital-select" required
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option value="">Select a hospital...</option>
                                ${hospitalOptions}
                            </select>
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="ambulance-involved"
                                    class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                                <span class="ml-2 text-sm font-medium text-gray-700">Ambulance service was involved</span>
                            </label>
                            <div id="ambulance-section" class="hidden mt-2">
                                <label for="ambulance-select" class="block text-sm font-medium text-gray-700 mb-2">Ambulance Trust</label>
                                <select id="ambulance-select"
                                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                    <option value="">Select an ambulance trust...</option>
                                    ${ambulanceOptions}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label for="visit-type" class="block text-sm font-medium text-gray-700 mb-2">Type of Visit</label>
                            <select id="visit-type" required
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option value="">Select visit type...</option>
                                <option value="emergency">Emergency</option>
                                <option value="outpatient">Outpatient Appointment</option>
                                <option value="inpatient">Inpatient Stay</option>
                                <option value="procedure">Procedure/Surgery</option>
                                <option value="test">Tests/Diagnostic</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label for="visit-notes" class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea id="visit-notes" rows="4"
                                placeholder="Add any additional details about your visit..."
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"></textarea>
                        </div>
                    </div>
                    <!-- Right Column: Condition-Specific Questions -->
                    <div class="space-y-4">
                        ${conditionQuestions ? `
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full flex flex-col">
                                <h4 class="font-semibold text-gray-900 mb-3">📋 Condition-Specific Questions</h4>
                                <p class="text-sm text-gray-600 mb-4">Based on your tracked conditions:</p>
                                <div class="flex-1 overflow-y-auto">${conditionQuestions}</div>
                            </div>
                        ` : `<div class='text-gray-500 text-sm'>No tracked conditions. Add some in your profile for personalized questions.</div>`}
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-4 border-t mt-4">
                    <button type="button" class="cancel-btn px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit"
                        class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Add Record
                    </button>
                </div>
            </form>
        `;
    }

    generateConditionQuestionsForRecord(userConditions) {
        if (!userConditions || userConditions.length === 0) return '';

        const conditionQuestions = {
            'epilepsy': [
                { id: 'seizure_occurred', type: 'checkbox', label: 'Did you have a seizure during this visit?' },
                { id: 'seizure_frequency', type: 'text', label: 'Recent seizure frequency', placeholder: 'e.g., 2 this week' }
            ],
            'autism': [
                { id: 'sensory_issues', type: 'checkbox', label: 'Did you experience sensory overload?' },
                { id: 'anxiety_level', type: 'select', label: 'Anxiety level during visit', options: ['Low', 'Medium', 'High', 'Severe'] }
            ],
            'diabetes': [
                { id: 'blood_sugar_check', type: 'text', label: 'Blood sugar level (if checked)', placeholder: 'e.g., 120 mg/dL' },
                { id: 'hypo_symptoms', type: 'checkbox', label: 'Did you experience hypoglycemic symptoms?' }
            ],
            'mental_health': [
                { id: 'panic_attack', type: 'checkbox', label: 'Did you have a panic attack?' },
                { id: 'mood_rating', type: 'select', label: 'Overall mood during visit', options: ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'] }
            ],
            'chronic_pain': [
                { id: 'pain_level', type: 'select', label: 'Pain level (1-10)', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] }
            ]
        };

        let questionsHTML = '';

        userConditions.forEach(condition => {
            const questions = conditionQuestions[condition];
            if (questions) {
                questionsHTML += `
                    <div class="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                        <h5 class="font-medium text-gray-900 mb-3 capitalize">${condition.replace('_', ' ')} Related</h5>
                        <div class="space-y-3">
                            ${questions.map(q => {
                                switch (q.type) {
                                    case 'checkbox':
                                        return `
                                            <label class="flex items-center">
                                                <input type="checkbox" name="condition_${condition}_${q.id}" 
                                                       class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                                                <span class="ml-2 text-sm text-gray-700">${q.label}</span>
                                            </label>
                                        `;
                                    case 'select':
                                        return `
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">${q.label}</label>
                                                <select name="condition_${condition}_${q.id}" 
                                                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                                    <option value="">Select...</option>
                                                    ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                                                </select>
                                            </div>
                                        `;
                                    default: // text
                                        return `
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">${q.label}</label>
                                                <input type="text" name="condition_${condition}_${q.id}" 
                                                       placeholder="${q.placeholder || ''}"
                                                       class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                            </div>
                                        `;
                                }
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        return questionsHTML;
    }

    generateConditionQuestionsForSymptoms(userConditions) {
        if (!userConditions || userConditions.length === 0) return '';

        const conditionQuestions = {
            'epilepsy': [
                { id: 'seizure_today', type: 'checkbox', label: 'Did you have a seizure today?' },
                { id: 'aura_symptoms', type: 'checkbox', label: 'Did you experience aura symptoms?' },
                { id: 'trigger_identified', type: 'text', label: 'Potential trigger (if known)', placeholder: 'e.g., stress, lack of sleep, flashing lights' },
                { id: 'medication_taken', type: 'checkbox', label: 'Did you take your medication as prescribed?' }
            ],
            'autism': [
                { id: 'sensory_overload', type: 'select', label: 'Sensory overload level', options: ['None', 'Mild', 'Moderate', 'Severe'] },
                { id: 'meltdown_occurred', type: 'checkbox', label: 'Did you experience a meltdown?' },
                { id: 'social_fatigue', type: 'select', label: 'Social fatigue level', options: ['None', 'Low', 'Medium', 'High', 'Exhausted'] },
                { id: 'stimming_frequency', type: 'select', label: 'Stimming frequency today', options: ['None', 'Occasional', 'Frequent', 'Constant'] }
            ],
            'diabetes': [
                { id: 'blood_sugar_morning', type: 'text', label: 'Morning blood sugar', placeholder: 'e.g., 120 mg/dL' },
                { id: 'blood_sugar_evening', type: 'text', label: 'Evening blood sugar', placeholder: 'e.g., 140 mg/dL' },
                { id: 'hypo_episode', type: 'checkbox', label: 'Did you have a hypoglycemic episode?' },
                { id: 'insulin_doses', type: 'text', label: 'Insulin doses taken', placeholder: 'e.g., 10 units morning, 8 units evening' }
            ],
            'mental_health': [
                { id: 'anxiety_level', type: 'select', label: 'Anxiety level today', options: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'] },
                { id: 'panic_attack', type: 'checkbox', label: 'Did you have a panic attack?' },
                { id: 'mood_rating', type: 'select', label: 'Overall mood', options: ['Very Low', 'Low', 'Neutral', 'Good', 'Very Good'] },
                { id: 'sleep_quality', type: 'select', label: 'Sleep quality last night', options: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'] }
            ],
            'chronic_pain': [
                { id: 'pain_level_morning', type: 'select', label: 'Pain level (morning)', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
                { id: 'pain_level_evening', type: 'select', label: 'Pain level (evening)', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
                { id: 'flare_up', type: 'checkbox', label: 'Did you experience a flare-up?' },
                { id: 'medication_effectiveness', type: 'select', label: 'Pain medication effectiveness', options: ['Not effective', 'Slightly effective', 'Moderately effective', 'Very effective', 'Completely effective'] }
            ],
            'heart_condition': [
                { id: 'heart_rate_resting', type: 'text', label: 'Resting heart rate', placeholder: 'e.g., 72 bpm' },
                { id: 'blood_pressure', type: 'text', label: 'Blood pressure', placeholder: 'e.g., 120/80' },
                { id: 'chest_pain', type: 'checkbox', label: 'Did you experience chest pain?' },
                { id: 'palpitations', type: 'checkbox', label: 'Did you notice palpitations?' }
            ],
            'respiratory': [
                { id: 'breathing_difficulty', type: 'select', label: 'Breathing difficulty level', options: ['None', 'Mild', 'Moderate', 'Severe'] },
                { id: 'peak_flow', type: 'text', label: 'Peak flow reading', placeholder: 'e.g., 450 L/min' },
                { id: 'inhaler_usage', type: 'text', label: 'Inhaler uses today', placeholder: 'e.g., 3 times' },
                { id: 'oxygen_saturation', type: 'text', label: 'Oxygen saturation', placeholder: 'e.g., 98%' }
            ],
            'autoimmune': [
                { id: 'flare_severity', type: 'select', label: 'Flare-up severity', options: ['None', 'Mild', 'Moderate', 'Severe'] },
                { id: 'fatigue_level', type: 'select', label: 'Fatigue level', options: ['None', 'Mild', 'Moderate', 'Severe', 'Debilitating'] },
                { id: 'joint_pain', type: 'select', label: 'Joint pain level', options: ['None', 'Mild', 'Moderate', 'Severe'] },
                { id: 'medication_side_effects', type: 'checkbox', label: 'Did you experience medication side effects?' }
            ],
            'neurological': [
                { id: 'migraine_occurred', type: 'checkbox', label: 'Did you have a migraine?' },
                { id: 'coordination_issues', type: 'checkbox', label: 'Did you notice coordination problems?' },
                { id: 'memory_problems', type: 'checkbox', label: 'Did you experience memory issues?' },
                { id: 'speech_difficulties', type: 'checkbox', label: 'Did you have speech difficulties?' }
            ],
            'gastrointestinal': [
                { id: 'symptom_severity', type: 'select', label: 'Symptom severity today', options: ['None', 'Mild', 'Moderate', 'Severe'] },
                { id: 'food_triggers', type: 'text', label: 'Food triggers (if any)', placeholder: 'e.g., dairy, gluten' },
                { id: 'bathroom_urgency', type: 'select', label: 'Bathroom urgency episodes', options: ['None', '1-2', '3-5', '6-10', 'More than 10'] },
                { id: 'medication_response', type: 'select', label: 'Medication effectiveness', options: ['Not taken', 'Not effective', 'Somewhat effective', 'Very effective'] }
            ]
        };
        
        let questionsHTML = '';

        userConditions.forEach(condition => {
            const questions = conditionQuestions[condition];
            if (questions) {
                questionsHTML += `
                    <div class="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                        <h5 class="font-medium text-gray-900 mb-3 capitalize">${condition.replace('_', ' ')} Tracking</h5>
                        <div class="space-y-3">
                            ${questions.map(q => {
                                switch (q.type) {
                                    case 'checkbox':
                                        return `
                                            <label class="flex items-center">
                                                <input type="checkbox" name="condition_${condition}_${q.id}" 
                                                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                                <span class="ml-2 text-sm text-gray-700">${q.label}</span>
                                            </label>
                                        `;
                                    case 'select':
                                        return `
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">${q.label}</label>
                                                <select name="condition_${condition}_${q.id}" 
                                                        class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                    <option value="">Select...</option>
                                                    ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                                                </select>
                                            </div>
                                        `;
                                    default: // text
                                        return `
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">${q.label}</label>
                                                <input type="text" name="condition_${condition}_${q.id}" 
                                                       placeholder="${q.placeholder || ''}"
                                                       class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            </div>
                                        `;
                                }
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        return questionsHTML;
    }

    processFormData(form) {
        const record = {
            date: form.querySelector('#visit-date').value,
            time: form.querySelector('#visit-time').value,
            hospital: form.querySelector('#hospital-select').value,
            ambulanceInvolved: form.querySelector('#ambulance-involved').checked,
            ambulance: form.querySelector('#ambulance-select')?.value || null,
            visitType: form.querySelector('#visit-type').value,
            notes: form.querySelector('#visit-notes').value,
            conditions: {}
        };

        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('condition_')) {
                const parts = key.split('_');
                const condition = parts[1];
                const field = parts.slice(2).join('_');
                
                if (!record.conditions[condition]) {
                    record.conditions[condition] = {};
                }
                
                const inputElement = form.querySelector(`[name="${key}"]`);
                if (inputElement && inputElement.type === 'checkbox') {
                    record.conditions[condition][field] = inputElement.checked;
                } else if (value) {
                    record.conditions[condition][field] = value;
                }
            }
        }
        
        return record;
    }

    createEditProfileForm(currentProfile) {
        const conditions = currentProfile.conditions || {};

        const conditionOptions = `
            <option value="">Select a condition...</option>
            <option value="epilepsy" ${conditions.epilepsy ? 'selected' : ''}>Epilepsy</option>
            <option value="autism" ${conditions.autism ? 'selected' : ''}>Autism</option>
            <option value="diabetes" ${conditions.diabetes ? 'selected' : ''}>Diabetes</option>
            <option value="mental_health" ${conditions.mental_health ? 'selected' : ''}>Mental Health</option>
            <option value="chronic_pain" ${conditions.chronic_pain ? 'selected' : ''}>Chronic Pain</option>
            <option value="heart_condition" ${conditions.heart_condition ? 'selected' : ''}>Heart Condition</option>
            <option value="respiratory" ${conditions.respiratory ? 'selected' : ''}>Respiratory Issues</option>
            <option value="autoimmune" ${conditions.autoimmune ? 'selected' : ''}>Autoimmune Disorders</option>
            <option value="neurological" ${conditions.neurological ? 'selected' : ''}>Neurological Disorders</option>
            <option value="gastrointestinal" ${conditions.gastrointestinal ? 'selected' : ''}>Gastrointestinal Issues</option>
        `;

        return `
            <form id="edit-profile-form" class="space-y-4">
                <div>
                    <label for="display-name" class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                    <input type="text" id="display-name" value="${currentProfile.displayName || ''}"
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="email" value="${currentProfile.email || ''}"
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                </div>
                <div>
                    <label for="conditions-select" class="block text-sm font-medium text-gray-700 mb-2">Tracked Conditions</label>
                    <select id="conditions-select" multiple
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                        ${conditionOptions}
                    </select>
                    <p class="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Command (Mac) to select multiple conditions.</p>
                </div>
                <div class="flex justify-end space-x-3 pt-4 border-t mt-4">
                    <button type="button" class="cancel-btn px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit"
                        class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Save Changes
                    </button>
                </div>
            </form>
        `;
    }
}
