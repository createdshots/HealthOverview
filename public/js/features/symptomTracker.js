// Symptom Tracker and Medical Incident Recording System
import { showModal, hideModal } from '../components/modal.js';
import { showStatusMessage } from '../utils/ui.js';

export class SymptomTracker {
    constructor() {
        this.dataManager = null;
        this.currentUser = null;
        this.onStatusCallback = null;
    }

    // Set data manager reference
    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    // Set current user
    setCurrentUser(user) {
        this.currentUser = user;
    }

    // Status callback for showing messages
    onStatus(callback) {
        this.onStatusCallback = callback;
    }

    showStatus(message, type = 'success') {
        if (this.onStatusCallback) {
            this.onStatusCallback(message, type);
        } else {
            showStatusMessage(message, type);
        }
    }

    // Main function to show the symptom tracker modal
    showSymptomTracker() {
        if (!this.dataManager) {
            this.showStatus('Data manager not initialized', 'error');
            return;
        }

        const data = this.dataManager.getData();
        const userConditions = data.userProfile?.conditions || [];

        // Generate hospital and ambulance options
        const hospitalOptions = data.hospitals?.map(h =>
            `<option value="${h.name}">${h.name}</option>`
        ).join('') || '';

        const ambulanceOptions = data.ambulance?.map(a =>
            `<option value="${a.name}">${a.name}</option>`
        ).join('') || '';

        // Generate condition-specific questions
        const conditionQuestions = this.generateConditionQuestions(userConditions);

        const modalContent = this.generateSymptomTrackerHTML(hospitalOptions, ambulanceOptions, conditionQuestions);

        showModal(modalContent, false);
        this.setupSymptomTrackerEventListeners();
    }

    // Generate the main symptom tracker modal HTML
    generateSymptomTrackerHTML(hospitalOptions, ambulanceOptions, conditionQuestions) {
        return `
            <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-900">Medical Incident Tracker</h2>
                        <button onclick="hideModal()" class="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                    </div>
                    <p class="text-gray-600 mt-2">Record a medical incident, visit, or symptom log</p>
                </div>

                <form id="symptom-tracker-form" class="p-6 space-y-6">
                    <!-- Incident Type Selection -->
                    <div class="space-y-3">
                        <label class="block text-sm font-semibold text-gray-700">Incident Type</label>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                                <input type="radio" name="incidentType" value="hospital_visit" class="mr-3 text-blue-600">
                                <div>
                                    <div class="font-medium text-gray-900">Hospital Visit</div>
                                    <div class="text-sm text-gray-500">Emergency or planned visit</div>
                                </div>
                            </label>
                            <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                                <input type="radio" name="incidentType" value="ambulance_call" class="mr-3 text-blue-600">
                                <div>
                                    <div class="font-medium text-gray-900">Ambulance Call</div>
                                    <div class="text-sm text-gray-500">Emergency transport</div>
                                </div>
                            </label>
                            <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                                <input type="radio" name="incidentType" value="symptom_log" class="mr-3 text-blue-600">
                                <div>
                                    <div class="font-medium text-gray-900">Symptom Log</div>
                                    <div class="text-sm text-gray-500">Track symptoms</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Date and Time -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="incident-date" class="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                            <input type="date" id="incident-date" name="incidentDate" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label for="incident-time" class="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                            <input type="time" id="incident-time" name="incidentTime" required 
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>

                    <!-- Hospital/Ambulance Selection (shown based on incident type) -->
                    <div id="hospital-selection" class="hidden">
                        <label for="hospital-select" class="block text-sm font-semibold text-gray-700 mb-2">Hospital</label>
                        <select id="hospital-select" name="hospital" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Select a hospital...</option>
                            ${hospitalOptions}
                        </select>
                    </div>

                    <div id="ambulance-selection" class="hidden">
                        <label for="ambulance-select" class="block text-sm font-semibold text-gray-700 mb-2">Ambulance Service</label>
                        <select id="ambulance-select" name="ambulance" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">Select an ambulance service...</option>
                            ${ambulanceOptions}
                        </select>
                    </div>

                    <!-- Severity Rating -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-3">Severity/Intensity Level</label>
                        <div class="flex items-center space-x-4">
                            <span class="text-sm text-gray-500">Mild</span>
                            <div class="flex space-x-2">
                                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
                                    <label class="cursor-pointer">
                                        <input type="radio" name="severity" value="${num}" class="sr-only">
                                        <div class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-medium hover:border-blue-500 transition-colors severity-btn">
                                            ${num}
                                        </div>
                                    </label>
                                `).join('')}
                            </div>
                            <span class="text-sm text-gray-500">Severe</span>
                        </div>
                    </div>

                    <!-- Condition-Specific Questions -->
                    ${conditionQuestions}

                    <!-- Main Symptoms/Description -->
                    <div>
                        <label for="main-symptoms" class="block text-sm font-semibold text-gray-700 mb-2">Symptoms/Description</label>
                        <textarea id="main-symptoms" name="symptoms" rows="4" 
                                  placeholder="Describe your symptoms, what happened, or any relevant details..."
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
                    </div>

                    <!-- Treatment/Action Taken -->
                    <div>
                        <label for="treatment" class="block text-sm font-semibold text-gray-700 mb-2">Treatment/Action Taken</label>
                        <textarea id="treatment" name="treatment" rows="3" 
                                  placeholder="What treatment was given or what action did you take?"
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
                    </div>

                    <!-- Notes -->
                    <div>
                        <label for="notes" class="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                        <textarea id="notes" name="notes" rows="3" 
                                  placeholder="Any additional information, follow-up needed, etc."
                                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
                    </div>

                    <!-- Submit Buttons -->
                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" onclick="hideModal()" 
                                class="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Save Record
                        </button>
                    </div>
                </form>
            </div>

            <style>
                .severity-btn:has(input:checked) {
                    background-color: #3B82F6;
                    border-color: #3B82F6;
                    color: white;
                }
                
                input[type="radio"]:checked + .severity-btn {
                    background-color: #3B82F6;
                    border-color: #3B82F6;
                    color: white;
                }
            </style>
        `;
    }

    // Generate condition-specific questions based on user's tracked conditions
    generateConditionQuestions(userConditions) {
        if (!userConditions || userConditions.length === 0) {
            return '';
        }

        const conditionQuestionMap = {
            'diabetes': [
                { question: 'Blood sugar level (if measured)', type: 'number', placeholder: 'mg/dL' },
                { question: 'Insulin taken?', type: 'select', options: ['Yes', 'No', 'Not applicable'] }
            ],
            'hypertension': [
                { question: 'Blood pressure (if measured)', type: 'text', placeholder: 'e.g., 120/80' },
                { question: 'Medication taken today?', type: 'select', options: ['Yes', 'No', 'Partial'] }
            ],
            'asthma': [
                { question: 'Peak flow reading (if measured)', type: 'number', placeholder: 'L/min' },
                { question: 'Inhaler used?', type: 'select', options: ['Yes', 'No', 'Multiple times'] }
            ],
            'heart_disease': [
                { question: 'Chest pain level (1-10)', type: 'range', min: 1, max: 10 },
                { question: 'Shortness of breath?', type: 'select', options: ['None', 'Mild', 'Moderate', 'Severe'] }
            ],
            'arthritis': [
                { question: 'Joint pain level (1-10)', type: 'range', min: 1, max: 10 },
                { question: 'Affected joints', type: 'text', placeholder: 'e.g., knees, hands' }
            ],
            'depression': [
                { question: 'Mood level today (1-10)', type: 'range', min: 1, max: 10 },
                { question: 'Sleep quality', type: 'select', options: ['Poor', 'Fair', 'Good', 'Excellent'] }
            ],
            'anxiety': [
                { question: 'Anxiety level (1-10)', type: 'range', min: 1, max: 10 },
                { question: 'Panic attacks today?', type: 'select', options: ['None', '1', '2-3', 'More than 3'] }
            ]
        };

        let questionsHTML = '<div class="space-y-4"><h3 class="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Condition-Specific Questions</h3>';

        userConditions.forEach(condition => {
            const questions = conditionQuestionMap[condition.toLowerCase()];
            if (questions) {
                questionsHTML += `<div class="bg-blue-50 p-4 rounded-lg"><h4 class="font-medium text-blue-900 mb-3">${condition.charAt(0).toUpperCase() + condition.slice(1)} Related</h4>`;

                questions.forEach((q, index) => {
                    const fieldName = `${condition}_${index}`;
                    questionsHTML += `<div class="mb-3">`;
                    questionsHTML += `<label for="${fieldName}" class="block text-sm font-medium text-gray-700 mb-1">${q.question}</label>`;

                    if (q.type === 'select') {
                        questionsHTML += `<select id="${fieldName}" name="${fieldName}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">`;
                        questionsHTML += `<option value="">Select...</option>`;
                        q.options.forEach(option => {
                            questionsHTML += `<option value="${option}">${option}</option>`;
                        });
                        questionsHTML += `</select>`;
                    } else if (q.type === 'range') {
                        questionsHTML += `<div class="flex items-center space-x-3">`;
                        questionsHTML += `<span class="text-sm text-gray-500">${q.min}</span>`;
                        questionsHTML += `<input type="range" id="${fieldName}" name="${fieldName}" min="${q.min}" max="${q.max}" class="flex-1">`;
                        questionsHTML += `<span class="text-sm text-gray-500">${q.max}</span>`;
                        questionsHTML += `<span id="${fieldName}_value" class="font-medium text-blue-600 min-w-[2rem] text-center">-</span>`;
                        questionsHTML += `</div>`;
                    } else {
                        questionsHTML += `<input type="${q.type}" id="${fieldName}" name="${fieldName}" placeholder="${q.placeholder || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">`;
                    }

                    questionsHTML += `</div>`;
                });

                questionsHTML += `</div>`;
            }
        });

        questionsHTML += '</div>';
        return questionsHTML;
    }

    // Setup event listeners for the symptom tracker form
    setupSymptomTrackerEventListeners() {
        // Set default date and time to now
        const now = new Date();
        const dateInput = document.getElementById('incident-date');
        const timeInput = document.getElementById('incident-time');

        if (dateInput) {
            dateInput.value = now.toISOString().split('T')[0];
        }
        if (timeInput) {
            timeInput.value = now.toTimeString().slice(0, 5);
        }

        // Handle incident type change
        const incidentTypeRadios = document.querySelectorAll('input[name="incidentType"]');
        incidentTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const hospitalSection = document.getElementById('hospital-selection');
                const ambulanceSection = document.getElementById('ambulance-selection');

                // Hide both sections first
                hospitalSection.classList.add('hidden');
                ambulanceSection.classList.add('hidden');

                // Show relevant section based on selection
                if (e.target.value === 'hospital_visit') {
                    hospitalSection.classList.remove('hidden');
                } else if (e.target.value === 'ambulance_call') {
                    ambulanceSection.classList.remove('hidden');
                }
            });
        });

        // Handle severity rating selection
        const severityBtns = document.querySelectorAll('.severity-btn');
        severityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                severityBtns.forEach(b => {
                    b.classList.remove('bg-blue-600', 'border-blue-600', 'text-white');
                    b.classList.add('border-gray-300');
                });

                // Add active class to clicked button
                btn.classList.add('bg-blue-600', 'border-blue-600', 'text-white');
                btn.classList.remove('border-gray-300');

                // Set the radio button value
                const radio = btn.previousElementSibling;
                if (radio) radio.checked = true;
            });
        });

        // Handle range inputs for condition questions
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(range => {
            const valueDisplay = document.getElementById(range.id + '_value');
            if (valueDisplay) {
                range.addEventListener('input', (e) => {
                    valueDisplay.textContent = e.target.value;
                });
            }
        });

        // Handle form submission
        const form = document.getElementById('symptom-tracker-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(form);
            });
        }
    }

    // Handle the form submission
    handleFormSubmission(form) {
        const formData = new FormData(form);
        const incidentData = {};

        // Basic form data
        for (let [key, value] of formData.entries()) {
            incidentData[key] = value;
        }

        // Add metadata
        incidentData.id = Date.now().toString();
        incidentData.timestamp = new Date().toISOString();
        incidentData.userId = this.currentUser?.uid;

        // Process condition-specific answers
        const conditionAnswers = {};
        for (let [key, value] of formData.entries()) {
            if (key.includes('_') && !['incident_date', 'incident_time'].includes(key)) {
                const parts = key.split('_');
                if (parts.length >= 2) {
                    const condition = parts[0];
                    if (!conditionAnswers[condition]) {
                        conditionAnswers[condition] = {};
                    }
                    conditionAnswers[condition][key] = value;
                }
            }
        }
        incidentData.conditionAnswers = conditionAnswers;

        // Validate required fields
        if (!incidentData.incidentType) {
            this.showStatus('Please select an incident type', 'error');
            return;
        }

        if (!incidentData.incidentDate || !incidentData.incidentTime) {
            this.showStatus('Please provide date and time', 'error');
            return;
        }

        if (!incidentData.severity) {
            this.showStatus('Please rate the severity level', 'error');
            return;
        }

        // Save the incident record
        this.saveIncidentRecord(incidentData);
    }

    // Save the incident record to the data manager
    async saveIncidentRecord(incidentData) {
        try {
            if (!this.dataManager) {
                throw new Error('Data manager not available');
            }

            const data = this.dataManager.getData();

            // Initialize medicalRecords array if it doesn't exist
            if (!data.medicalRecords) {
                data.medicalRecords = [];
            }

            // Add the new record
            data.medicalRecords.push(incidentData);

            // Update visit counts if applicable
            if (incidentData.incidentType === 'hospital_visit' && incidentData.hospital) {
                this.updateHospitalVisitCount(data, incidentData.hospital);
            } else if (incidentData.incidentType === 'ambulance_call' && incidentData.ambulance) {
                this.updateAmbulanceVisitCount(data, incidentData.ambulance);
            }

            // Save data through data manager
            this.dataManager.setData(data);
            await this.dataManager.saveData();

            this.showStatus('Medical record saved successfully!', 'success');
            hideModal();

            // Trigger any UI updates if needed
            if (typeof window.refreshProfileData === 'function') {
                window.refreshProfileData();
            }

        } catch (error) {
            console.error('Error saving medical record:', error);
            this.showStatus('Failed to save medical record', 'error');
        }
    }

    // Update hospital visit count
    updateHospitalVisitCount(data, hospitalName) {
        if (data.hospitals) {
            const hospital = data.hospitals.find(h => h.name === hospitalName);
            if (hospital) {
                hospital.visited = true;
                hospital.count = (hospital.count || 0) + 1;
                hospital.lastVisit = new Date().toISOString();
            }
        }
    }

    // Update ambulance visit count
    updateAmbulanceVisitCount(data, ambulanceName) {
        if (data.ambulance) {
            const ambulance = data.ambulance.find(a => a.name === ambulanceName);
            if (ambulance) {
                ambulance.visited = true;
                ambulance.count = (ambulance.count || 0) + 1;
                ambulance.lastVisit = new Date().toISOString();
            }
        }
    }

    // Show symptom tracker overview/stats
    showSymptomOverview() {
        if (!this.dataManager) {
            this.showStatus('Data manager not initialized', 'error');
            return;
        }

        const data = this.dataManager.getData();
        const records = data.medicalRecords || [];

        const overviewHTML = this.generateSymptomOverviewHTML(records);
        showModal(overviewHTML, true);
        this.setupOverviewChart(records);
    }
    // Generate symptom overview HTML with chart
    generateSymptomOverviewHTML(records) {
        const totalRecords = records.length;
        const recentRecords = records.filter(r => {
            const recordDate = new Date(r.timestamp);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return recordDate >= thirtyDaysAgo;
        }).length;

        const averageSeverity = records.length > 0 ?
            (records.reduce((sum, r) => sum + (parseInt(r.severity) || 0), 0) / records.length).toFixed(1) : 'N/A';

        return `
            <div class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-900">Symptom Overview</h2>
                        <button onclick="hideModal()" class="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                    </div>
                </div>

                <div class="p-6">
                    <!-- Summary Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-blue-50 p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-blue-600">${totalRecords}</div>
                            <div class="text-sm text-gray-600">Total Records</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-green-600">${recentRecords}</div>
                            <div class="text-sm text-gray-600">Last 30 Days</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-purple-600">${averageSeverity}</div>
                            <div class="text-sm text-gray-600">Avg Severity</div>
                        </div>
                    </div>

                    <!-- Chart Container -->
                    <div class="mb-8">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Symptom Tracking Over Time</h3>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <canvas id="symptom-chart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <!-- Recent Records -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Records</h3>
                        <div class="space-y-3 max-h-60 overflow-y-auto">
                            ${this.generateRecentRecordsHTML(records.slice(-10).reverse())}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate recent records HTML
    generateRecentRecordsHTML(records) {
        if (records.length === 0) {
            return '<p class="text-gray-500 text-center py-4">No records found</p>';
        }

        return records.map(record => {
            const date = new Date(record.timestamp).toLocaleDateString();
            const time = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const typeLabel = record.incidentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const severityColor = this.getSeverityColor(record.severity);

            return `
                <div class="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2">
                                <span class="font-medium text-gray-900">${typeLabel}</span>
                                <span class="px-2 py-1 text-xs rounded-full ${severityColor}">
                                    Severity ${record.severity}
                                </span>
                            </div>
                            <div class="text-sm text-gray-600 mt-1">
                                ${date} at ${time}
                                ${record.hospital ? `• ${record.hospital}` : ''}
                                ${record.ambulance ? `• ${record.ambulance}` : ''}
                            </div>
                            ${record.symptoms ? `<div class="text-sm text-gray-700 mt-2">${record.symptoms.substring(0, 100)}${record.symptoms.length > 100 ? '...' : ''}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get severity color class
    getSeverityColor(severity) {
        const level = parseInt(severity);
        if (level <= 3) return 'bg-green-100 text-green-800';
        if (level <= 6) return 'bg-yellow-100 text-yellow-800';
        if (level <= 8) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    }

    // Setup chart for symptom overview
    setupOverviewChart(records) {
        // Wait for the modal to be fully rendered
        setTimeout(() => {
            const canvas = document.getElementById('symptom-chart');
            if (!canvas || !window.Chart) {
                console.log('Chart.js not available or canvas not found');
                return;
            }

            // Prepare data for the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const dailyData = {};

            // Initialize all days with 0
            for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                dailyData[dateStr] = { count: 0, avgSeverity: 0, records: [] };
            }

            // Fill in actual data
            records.forEach(record => {
                const recordDate = new Date(record.timestamp);
                if (recordDate >= thirtyDaysAgo) {
                    const dateStr = recordDate.toISOString().split('T')[0];
                    if (dailyData[dateStr]) {
                        dailyData[dateStr].records.push(record);
                        dailyData[dateStr].count++;
                    }
                }
            });

            // Calculate average severity for each day
            Object.keys(dailyData).forEach(date => {
                const dayData = dailyData[date];
                if (dayData.records.length > 0) {
                    dayData.avgSeverity = dayData.records.reduce((sum, r) => sum + (parseInt(r.severity) || 0), 0) / dayData.records.length;
                }
            });

            const sortedDates = Object.keys(dailyData).sort();
            const labels = sortedDates.map(date => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' }));
            const countData = sortedDates.map(date => dailyData[date].count);
            const severityData = sortedDates.map(date => dailyData[date].avgSeverity);

            new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Number of Records',
                            data: countData,
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Average Severity',
                            data: severityData,
                            borderColor: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Number of Records'
                            },
                            min: 0
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Average Severity'
                            },
                            min: 0,
                            max: 10,
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
        }, 100);
    }
}

// Create and export singleton instance
export const symptomTracker = new SymptomTracker();

// Export individual functions for easy access
export function showSymptomTracker() {
    symptomTracker.showSymptomTracker();
}

export function showSymptomOverview() {
    symptomTracker.showSymptomOverview();
}
