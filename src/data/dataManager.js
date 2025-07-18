// Data Manager for Hospital Tracker Application
export class DataManager {
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
        
        this.firebaseAuth = null;
        this.statusCallback = null;
        this.loadingCallback = null;
    }

    setFirebaseAuth(firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
    }

    onStatus(callback) {
        this.statusCallback = callback;
    }

    onLoading(callback) {
        this.loadingCallback = callback;
    }

    showStatus(message, type = 'success') {
        if (this.statusCallback) {
            this.statusCallback(message, type);
        }
    }

    setLoading(isLoading, text = '') {
        if (this.loadingCallback) {
            this.loadingCallback(isLoading, text);
        }
    }

    getData() {
        return this.localData;
    }

    setData(data) {
        this.localData = {
            hospitals: [],
            ambulance: [],
            awards: [],
            visitHistory: [],
            medicalRecords: [],
            symptomTracking: [],
            userProfile: {},
            ...data
        };
    }

    async initializeDefaultData() {
        try {
            this.setLoading(true, 'Setting up your data...');
            
            // Load hospitals
            const hospitals = await this.loadListFromFile('hospitals');
            // Load ambulances
            const ambulance = await this.loadListFromFile('ambulance');
            
            // Set up localData
            this.localData = {
                hospitals: hospitals || [],
                ambulance: ambulance || [],
                awards: [],
                visitHistory: [],
                medicalRecords: [],
                symptomTracking: [],
                userProfile: {}
            };
            
            // Save to Firestore
            await this.saveData();
            this.showStatus('Default data initialized!', 'success');
        } catch (error) {
            console.error('Error initializing default data:', error);
            this.showStatus('Failed to initialize default data.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async loadListFromFile(type) {
        try {
            if (type === 'hospitals') {
                this.setLoading(true, 'Loading hospital data...');
                const response = await fetch('hospital_data.json');
                if (!response.ok) throw new Error("Could not load 'hospital_data.json'.");
                const data = await response.json();

                const newList = data.map(hospital => ({
                    name: hospital.name,
                    visited: false,
                    count: 0,
                    coords: hospital.coords,
                    city: hospital.city
                }));
                this.showStatus(`${newList.length} hospitals loaded successfully!`, 'success');
                return newList;

            } else { // Ambulance trusts still load from txt and geocode
                const fileName = 'ambulance.txt';
                const response = await fetch(fileName);
                if (!response.ok) {
                    throw new Error(`Could not load '${fileName}'. Make sure it is in the same folder as index.html.`);
                }
                const text = await response.text();
                if (text.trim().toLowerCase().startsWith('<!doctype html>')) {
                    throw new Error(`Server returned an HTML page for '${fileName}'. Please check that the file exists and is in the correct folder.`);
                }
                const lines = text.split(/\r\n?|\n/).filter(line => line.trim() !== '');

                if (lines.length === 0) {
                    this.showStatus(`${fileName} is empty or could not be read.`, "error");
                    return [];
                }

                this.setLoading(true, `Loading ${lines.length} ambulance trusts...`);

                const newList = [];
                for (const [index, line] of lines.entries()) {
                    const name = line.trim();
                    this.setLoading(true, 'Loading data...');
                    const coords = await this.geocodeLocation(name);
                    newList.push({ name, visited: false, count: 0, coords });
                    await new Promise(resolve => setTimeout(resolve, 250));
                }

                this.showStatus(`${newList.length} ambulance trusts loaded successfully!`, 'success');
                return newList;
            }
        } catch (error) {
            console.error(`Error loading ${type} list:`, error);
            this.showStatus(error.message, "error");
            this.setLoading(false);
            return [];
        }
    }

    async geocodeLocation(name) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    async saveData() {
        if (!this.firebaseAuth) {
            console.log("No Firebase auth available, skipping save");
            return false;
        }

        const success = await this.firebaseAuth.saveData(this.localData);
        if (success) {
            this.showStatus("Data saved successfully!", "success");
        } else {
            this.showStatus("Error saving data. Your changes may not be saved.", "error");
        }
        return success;
    }

    // Visit History Tracking
    logVisit(type, index, action) {
        const item = this.localData[type][index];
        const timestamp = new Date().toISOString();

        const historyEntry = {
            id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp,
            type,
            itemName: item.name,
            city: item.city || null,
            action,
            oldCount: item.count,
            newCount: action === 'count_increased' ? item.count + 1 :
                action === 'count_decreased' ? item.count - 1 : item.count,
            coords: item.coords
        };

        if (!this.localData.visitHistory) this.localData.visitHistory = [];
        this.localData.visitHistory.unshift(historyEntry); // Add to beginning for recent-first order

        // Keep only last 1000 entries to prevent data bloat
        if (this.localData.visitHistory.length > 1000) {
            this.localData.visitHistory = this.localData.visitHistory.slice(0, 1000);
        }
    }

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
        return true; // Indicate that data changed and re-render is needed
    }

    addMedicalRecord(record) {
        if (!this.localData.medicalRecords) {
            this.localData.medicalRecords = [];
        }
        
        record.id = record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        record.timestamp = record.timestamp || new Date().toISOString();
        
        this.localData.medicalRecords.unshift(record);
        return record;
    }

    addSymptomLog(symptomData) {
        if (!this.localData.symptomTracking) {
            this.localData.symptomTracking = [];
        }
        
        symptomData.id = symptomData.id || `${new Date().toISOString()}_${Math.random().toString(36).substr(2, 9)}`;
        symptomData.timestamp = symptomData.timestamp || new Date().toISOString();
        
        this.localData.symptomTracking.unshift(symptomData);
        return symptomData;
    }

    updateUserProfile(profileData) {
        this.localData.userProfile = {
            ...this.localData.userProfile,
            ...profileData
        };
    }

    getRecentActivity(limit = 5) {
        const activities = [];
        
        (this.localData.medicalRecords || []).forEach(entry => {
            activities.push({
                type: 'record',
                date: entry.date,
                timestamp: entry.timestamp,
                entry
            });
        });
        
        (this.localData.symptomTracking || []).forEach(entry => {
            activities.push({
                type: 'symptom',
                date: entry.date,
                timestamp: entry.timestamp,
                entry
            });
        });
        
        // Sort by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return activities.slice(0, limit);
    }

    getStats(type) {
        const data = this.localData[type] || [];
        if (data.length === 0) return null;
        
        const total = data.length;
        const visited = data.filter(item => item.visited).length;
        const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
        const totalVisits = data.reduce((sum, item) => sum + item.count, 0);
        
        return { total, visited, percentage, totalVisits };
    }

    getFilteredData(type, searchTerm = '') {
        const data = this.localData[type] || [];
        return data.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => b.visited - a.visited);
    }
}
