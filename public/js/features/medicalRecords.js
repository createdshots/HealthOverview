// Medical Records management system
import { modalManager } from '../components/modal.js';

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
            console.error('Data manager not set');
            return;
        }

        const data = this.dataManager.getData();
        const hospitalOptions = data.hospitals.map(h => 
            `<option value="${h.name}">${h.name}</option>`
        ).join('');
        
        const ambulanceOptions = data.ambulance.map(a => 
            `<option value="${a.name}">${a.name}</option>`
        ).join('');

        const userConditions = data.userProfile?.conditions || [];
        const conditionQuestions = this.generateConditionQuestionsForRecord(userConditions);

        const content = this.generateMedicalRecordForm(hospitalOptions, ambulanceOptions, conditionQuestions);
        
        const modal = modalManager.createModal('add-record-modal', 'Add Medical Record', content, 'max-w-6xl');
        
        // Setup form submission
        this.setupMedicalRecordForm(modal);
        
        modalManager.openModal(modal);
    }

    // Generate medical record form HTML
    generateMedicalRecordForm(hospitalOptions, ambulanceOptions, conditionQuestions) {
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

    // Generate condition-specific questions for medical records
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
                            ${questions.map(q => this.generateQuestionHTML(condition, q)).join('')}
                        </div>
                    </div>
                `;
            }
        });

        return questionsHTML;
    }

    // Generate individual question HTML
    generateQuestionHTML(condition, question) {
        switch (question.type) {
            case 'checkbox':
                return `
                    <label class="flex items-center">
                        <input type="checkbox" name="condition_${condition}_${question.id}" 
                               class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                        <span class="ml-2 text-sm text-gray-700">${question.label}</span>
                    </label>
                `;
            case 'select':
                return `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${question.label}</label>
                        <select name="condition_${condition}_${question.id}" 
                                class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                            <option value="">Select...</option>
                            ${question.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>
                    </div>
                `;
            default: // text
                return `
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${question.label}</label>
                        <input type="text" name="condition_${condition}_${question.id}" 
                               placeholder="${question.placeholder || ''}"
                               class="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                    </div>
                `;
        }
    }

    // Setup medical record form event handlers
    setupMedicalRecordForm(modal) {
        const form = modal.querySelector('#add-record-form');
        const ambulanceCheckbox = modal.querySelector('#ambulance-involved');
        const ambulanceSection = modal.querySelector('#ambulance-section');
        const cancelBtn = modal.querySelector('.cancel-btn');

        // Handle ambulance checkbox
        if (ambulanceCheckbox && ambulanceSection) {
            ambulanceCheckbox.addEventListener('change', () => {
                if (ambulanceCheckbox.checked) {
                    ambulanceSection.classList.remove('hidden');
                } else {
                    ambulanceSection.classList.add('hidden');
                    ambulanceSection.querySelector('#ambulance-select').value = '';
                }
            });
        }

        // Handle cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modalManager.closeModal(modal);
            });
        }

        // Handle form submission
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMedicalRecordSubmission(form, modal);
            });
        }
    }

    // Handle medical record form submission
    handleMedicalRecordSubmission(form, modal) {
        const formData = new FormData(form);
        
        // Collect basic form data
        const record = {
            date: formData.get('visit-date') || form.querySelector('#visit-date').value,
            time: form.querySelector('#visit-time').value,
            hospital: form.querySelector('#hospital-select').value,
            ambulance: form.querySelector('#ambulance-involved').checked ? form.querySelector('#ambulance-select').value : '',
            visitType: form.querySelector('#visit-type').value,
            notes: form.querySelector('#visit-notes').value,
            conditionData: {}
        };

        // Collect condition-specific data
        const conditionInputs = form.querySelectorAll('[name^="condition_"]');
        conditionInputs.forEach(input => {
            const name = input.name;
            let value;
            
            if (input.type === 'checkbox') {
                value = input.checked;
            } else {
                value = input.value;
            }
            
            if (value) {
                record.conditionData[name] = value;
            }
        });

        // Validate required fields
        if (!record.date || !record.hospital || !record.visitType) {
            alert('Please fill in all required fields.');
            return;
        }

        // Add the record
        this.dataManager.addMedicalRecord(record);
        
        // Close modal and show success message
        modalManager.closeModal(modal);
        
        if (this.dataManager.showStatusMessage) {
            this.dataManager.showStatusMessage('Medical record added successfully!', 'success');
        }

        // Trigger re-render if callback exists
        if (window.dashboardApp && window.dashboardApp.renderAll) {
            window.dashboardApp.renderAll();
        }
    }

    // Show medical records list
    showMedicalRecordsList() {
        if (!this.dataManager) return;
        
        const data = this.dataManager.getData();
        const records = data.medicalRecords || [];
        
        const content = this.generateMedicalRecordsListHTML(records);
        const modal = modalManager.createModal('medical-records-modal', 'Medical Records', content, 'max-w-4xl');
        modalManager.openModal(modal);
    }

    // Generate medical records list HTML
    generateMedicalRecordsListHTML(records) {
        if (records.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <p>No medical records found.</p>
                    <p class="text-sm">Add your first record using the "Add Record" button.</p>
                </div>
            `;
        }

        const recordsHTML = records.map(record => `
            <div class="border border-gray-200 rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-semibold text-gray-900">${record.hospital}</h4>
                        <p class="text-sm text-gray-600">${record.date}${record.time ? ` at ${record.time}` : ''}</p>
                    </div>
                    <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full capitalize">
                        ${record.visitType}
                    </span>
                </div>
                ${record.ambulance ? `<p class="text-sm text-gray-600 mb-2"><strong>Ambulance:</strong> ${record.ambulance}</p>` : ''}
                ${record.notes ? `<p class="text-sm text-gray-700 mb-2">${record.notes}</p>` : ''}
                ${Object.keys(record.conditionData || {}).length > 0 ? `
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <p class="text-xs text-gray-500 mb-2">Condition-specific data recorded</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

        return `
            <div class="max-h-96 overflow-y-auto">
                ${recordsHTML}
            </div>
        `;
    }
}

// Create and export singleton instance
export const medicalRecordsManager = new MedicalRecordsManager();
