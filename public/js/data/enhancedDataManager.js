console.log('enhancedDataManager.js loaded');
// Enhanced Data Management system for Hospital Tracker
import { db, doc, getDoc, setDoc } from '/firebaseConfig.js';

/**
 * Loads user data from Firestore.
 * @param {string} userId The user's unique ID.
 * @returns {Promise<{userData: object, onboardingCompleted: boolean}>}
 */
export async function loadUserData(userId) {
    if (!userId) throw new Error("User ID is required to load data.");
    
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const userData = docSnap.data();
        return {
            userData,
            onboardingCompleted: userData.onboardingCompleted || false
        };
    } else {
        // No document yet
        return { userData: null, onboardingCompleted: false };
    }
}

/**
 * Saves user data to Firestore.
 * @param {string} userId The user's unique ID.
 * @param {object} data The data to save.
 */
export async function saveUserData(userId, data) {
    if (!userId) throw new Error("User ID is required to save data.");
    
    const userDocRef = doc(db, 'users', userId);
    // Use merge: true to avoid overwriting fields unintentionally
    await setDoc(userDocRef, data, { merge: true });
}

/**
 * Enhanced Data Manager class for managing hospital and ambulance data.
 */
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
            const hospitalsResponse = await fetch('/js/data/hospital_data.json');
            if (!hospitalsResponse.ok) {
                console.warn('Failed to load hospital_data.json, using fallback data');
                // Fallback hospital data
                var hospitalsData = [
                    { name: "Royal London Hospital", city: "London" },
                    { name: "St Bartholomew's Hospital", city: "London" },
                    { name: "University College Hospital", city: "London" },
                    { name: "King's College Hospital", city: "London" },
                    { name: "Guy's Hospital", city: "London" }
                ];
            } else {
                var hospitalsData = await hospitalsResponse.json();
            }
            
            // Load ambulance data
            const ambulanceResponse = await fetch('/js/data/ambulance.txt');
            if (!ambulanceResponse.ok) {
                console.warn('Failed to load ambulance.txt, using fallback data');
                // Fallback ambulance data
                var ambulanceNames = [
                    "London Ambulance Service NHS Trust",
                    "South East Coast Ambulance Service NHS Foundation Trust",
                    "East of England Ambulance Service NHS Trust",
                    "West Midlands Ambulance Service NHS Foundation Trust",
                    "North West Ambulance Service NHS Trust"
                ];
            } else {
                const ambulanceText = await ambulanceResponse.text();
                var ambulanceNames = ambulanceText.trim().split('\n').filter(line => line.trim());
            }

            // Initialize data structure
            this.localData = {
                hospitals: hospitalsData.map(hospital => ({
                    ...hospital,
                    visited: false,
                    count: 0
                })),
                ambulance: ambulanceNames.map(name => ({
                    name: name.trim(),
                    visited: false,
                    count: 0
                })),
                awards: [],
                visitHistory: [],
                medicalRecords: [],
                symptomTracking: [],
                userProfile: {},
                onboardingCompleted: false
            };

            console.log("Default data initialized:", {
                hospitals: this.localData.hospitals.length,
                ambulance: this.localData.ambulance.length
            });

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
            
            // Add a timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            const snapshot = await Promise.race([
                getDoc(this.docRef),
                timeoutPromise
            ]);
            
            if (snapshot.exists()) {
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
                
                // Check if onboarding is completed
                const onboardingCompleted = this.localData.onboardingCompleted || 
                                       this.localData.userProfile?.onboardingCompleted || 
                                       false;
                
                return onboardingCompleted;
            } else {
                console.log("No user document found, initializing default data");
                const success = await this.initializeDefaultData();
                if (success) {
                    this.showStatusMessage('Default data imported successfully!', 'success');
                }
                return false; // New user, onboarding not completed
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            
            // If it's a permission error, the user might not be properly authenticated
            if (error.code === 'permission-denied' || error.message.includes('access control')) {
                console.log("Permission denied, treating as anonymous user");
                await this.initializeDefaultData();
                return true; // Skip onboarding for permission-denied users
            }
            
            this.showStatusMessage('Error loading user data. Using offline mode.', 'warning');
            await this.initializeDefaultData();
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
            // Ensure onboardingCompleted is at the top level for easy access
            if (this.localData.onboardingCompleted !== undefined) {
                // Make sure it's set at both locations for compatibility
                this.localData.userProfile = this.localData.userProfile || {};
                this.localData.userProfile.onboardingCompleted = this.localData.onboardingCompleted;
            }

            console.log("Attempting to save data to Firestore...", {
                userId: this.userId,
                docPath: this.docRef.path,
                dataKeys: Object.keys(this.localData),
                onboardingCompleted: this.localData.onboardingCompleted
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
