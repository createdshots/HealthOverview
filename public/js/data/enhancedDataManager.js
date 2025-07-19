// Enhanced Data Management system for Hospital Tracker
import { db, doc, getDoc, setDoc } from '../../firebaseConfig.js';

export class EnhancedDataManager {
    constructor() {
        this.localData = {
            hospitals: [],
            ambulance: [],
            awards: [],
            visitHistory: [],
            medicalRecords: [],
            symptomTracking: [],
            userProfile: {}
        };
        this.userId = null;
        this.docRef = null;
        this.statusCallbacks = [];
    }

    // Subscribe to status messages
    onStatusMessage(callback) {
        this.statusCallbacks.push(callback);
    }

    // Show status message
    showStatusMessage(message, type = 'success') {
        this.statusCallbacks.forEach(callback => callback(message, type));
    }

    // Set user ID and initialize document reference
    setUserId(userId) {
        this.userId = userId;
        if (userId && db) {
            this.docRef = doc(db, 'users', userId);
        } else {
            this.docRef = null;
        }
    }

    // Get current data
    getData() {
        return this.localData;
    }

    // Set data
    setData(data) {
        this.localData = { ...this.localData, ...data };
    }

    // Initialize default data from files
    async initializeDefaultData() {
        try {
            console.log("Loading default data from files...");
            
            // Load hospitals data
            const hospitalsResponse = await fetch('/js/hospital_data.json');
            if (!hospitalsResponse.ok) {
                throw new Error(`HTTP error! status: ${hospitalsResponse.status}`);
            }
            const hospitalsData = await hospitalsResponse.json();
            
            // Load ambulance data
            const ambulanceResponse = await fetch('/js/ambulance.txt');
            if (!ambulanceResponse.ok) {
                throw new Error(`HTTP error! status: ${ambulanceResponse.status}`);
            }
            const ambulanceText = await ambulanceResponse.text();
            const ambulanceData = ambulanceText.trim().split('\n').filter(line => line.trim());

            // Initialize data structure
            this.localData = {
                hospitals: hospitalsData.map(hospital => ({
                    ...hospital,
                    visited: false,
                    count: 0
                })),
                ambulance: ambulanceData.map(name => ({
                    name: name.trim(),
                    visited: false,
                    count: 0
                })),
                awards: [],
                visitHistory: [],
                medicalRecords: [],
                symptomTracking: [],
                userProfile: {}
            };

            // Save to Firestore if user is authenticated
            if (this.docRef && this.userId) {
                await setDoc(this.docRef, this.localData, { merge: true });
                console.log("Default data saved to Firestore");
            }

            return true;
        } catch (error) {
            console.error("Error loading default data:", error);
            this.showStatusMessage('Error loading default data. Please refresh the page.', 'error');
            return false;
        }
    }

    // Load user data from Firestore
    async loadUserData() {
        if (!this.docRef || !this.userId) {
            console.log("No document reference or user ID available");
            return false;
        }

        try {
            console.log("Loading user data from Firestore...", { userId: this.userId });
            const snapshot = await getDoc(this.docRef);
            
            if (snapshot.exists()) {
                // Merge existing data with loaded data
                const firestoreData = snapshot.data();
                this.localData = {
                    hospitals: [],
                    ambulance: [],
                    awards: [],
                    visitHistory: [],
                    medicalRecords: [],
                    symptomTracking: [],
                    userProfile: {},
                    ...firestoreData
                };
                console.log("User data loaded successfully");
                return true;
            } else {
                // Document doesn't exist, initialize with default data
                this.showStatusMessage('No user data found. Importing default hospitals and ambulances...', 'info');
                const success = await this.initializeDefaultData();
                if (success) {
                    this.showStatusMessage('Default data imported successfully!', 'success');
                }
                return success;
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            this.showStatusMessage('Error loading user data. Please refresh or contact support.', 'error');
            return false;
        }
    }

    // Save data to Firestore
    async saveData() {
        if (!this.docRef || !this.userId) {
            console.log("No document reference available, skipping save");
            return false;
        }

        try {
            console.log("Attempting to save data to Firestore...", {
                userId: this.userId,
                docPath: this.docRef.path,
                dataKeys: Object.keys(this.localData)
            });

            await setDoc(this.docRef, this.localData, { merge: true });
            console.log("Data saved successfully to Firestore");
            this.showStatusMessage("Data saved successfully!", "success");
            return true;
        } catch (error) {
            console.error("Error saving data to Firestore:", error);
            this.showStatusMessage("Error saving data. Your changes may not be saved.", "error");
            return false;
        }
    }

    // Log a visit action
    logVisit(type, index, action) {
        const item = this.localData[type]?.[index];
        if (!item) return;

        const visitLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: type,
            itemName: item.name,
            action: action,
            count: item.count || 0
        };

        if (!this.localData.visitHistory) {
            this.localData.visitHistory = [];
        }

        this.localData.visitHistory.unshift(visitLog);
        
        // Keep only the most recent 100 entries
        if (this.localData.visitHistory.length > 100) {
            this.localData.visitHistory = this.localData.visitHistory.slice(0, 100);
        }
    }

    // Handle interaction with data items
    handleInteraction(event) {
        const target = event.target;
        if (!target.dataset.type) return;

        const type = target.dataset.type;
        const index = parseInt(target.dataset.index);
        const data = this.localData[type];

        if (!data || !data[index]) return;

        let action = '';

        if (target.type === 'checkbox') {
            const wasVisited = data[index].visited;
            data[index].visited = target.checked;
            action = target.checked ? 'visited' : 'unvisited';

            if (target.checked && data[index].count === 0) {
                data[index].count = 1;
                action = 'visited'; // First visit
            }

            this.logVisit(type, index, action);

        } else if (target.dataset.action === 'increase') {
            action = 'count_increased';
            this.logVisit(type, index, action);

            data[index].count++;
            if (data[index].count > 0) {
                data[index].visited = true;
            }

        } else if (target.dataset.action === 'decrease' && data[index].count > 0) {
            action = 'count_decreased';
            this.logVisit(type, index, action);

            data[index].count--;
            if (data[index].count === 0) {
                data[index].visited = false;
            }
        }

        this.saveData();
        return { type, index, action };
    }

    // Add medical record
    addMedicalRecord(record) {
        if (!this.localData.medicalRecords) {
            this.localData.medicalRecords = [];
        }
        
        record.id = Date.now().toString();
        record.timestamp = new Date().toISOString();
        this.localData.medicalRecords.unshift(record);
        
        // Update related hospital/ambulance counts if applicable
        if (record.hospital) {
            const hospital = this.localData.hospitals.find(h => h.name === record.hospital);
            if (hospital) {
                hospital.visited = true;
                hospital.count = (hospital.count || 0) + 1;
            }
        }
        
        if (record.ambulance) {
            const ambulance = this.localData.ambulance.find(a => a.name === record.ambulance);
            if (ambulance) {
                ambulance.visited = true;
                ambulance.count = (ambulance.count || 0) + 1;
            }
        }

        this.saveData();
    }

    // Add symptom tracking entry
    addSymptomEntry(entry) {
        if (!this.localData.symptomTracking) {
            this.localData.symptomTracking = [];
        }
        
        entry.id = Date.now().toString();
        entry.timestamp = new Date().toISOString();
        this.localData.symptomTracking.unshift(entry);
        
        this.saveData();
    }

    // Get filtered data
    getFilteredData(type, searchTerm = '') {
        const data = this.localData[type] || [];
        if (!searchTerm) return data;
        
        return data.filter(item => 
            item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Get statistics
    getStats(type) {
        const data = this.localData[type] || [];
        const total = data.length;
        const visited = data.filter(item => item.visited).length;
        const totalCount = data.reduce((sum, item) => sum + (item.count || 0), 0);
        
        return {
            total,
            visited,
            unvisited: total - visited,
            totalCount,
            percentage: total > 0 ? Math.round((visited / total) * 100) : 0
        };
    }

    // Clear all data
    clearAllData() {
        this.localData = {
            hospitals: [],
            ambulance: [],
            awards: [],
            visitHistory: [],
            medicalRecords: [],
            symptomTracking: [],
            userProfile: {}
        };
    }
}

// Create and export singleton instance
export const enhancedDataManager = new EnhancedDataManager();
