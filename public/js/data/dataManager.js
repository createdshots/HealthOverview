// Data Manager for Hospital Tracker Application
export class DataManager {
    constructor() {
        this.data = {
            hospitals: [],
            ambulance: [],
            medicalRecords: [],
            awards: [],
            userProfile: {}
        };
        this.firebaseAuth = null;
        this.onStatusCallback = null;
        this.onLoadingCallback = null;
    }

    setFirebaseAuth(firebaseAuth) {
        this.firebaseAuth = firebaseAuth;
    }

    getData() {
        return this.data;
    }

    setData(newData) {
        if (newData) {
            this.data = { ...this.data, ...newData };
        }
    }

    async initializeDefaultData() {
        const defaultData = {
            hospitals: [],
            ambulance: [],
            medicalRecords: [],
            awards: [],
            userProfile: {
                displayName: 'Guest User',
                email: '',
                conditions: []
            }
        };
        
        this.setData(defaultData);
        this.showStatus('Default data loaded', 'info');
        return true;
    }

    async saveData() {
        if (!this.firebaseAuth) {
            console.warn('Firebase auth not available');
            return false;
        }

        this.setLoading(true, 'Saving your data...');
        
        try {
            const success = await this.firebaseAuth.saveData(this.data);
            if (success) {
                this.showStatus('Data saved successfully!', 'success');
            } else {
                this.showStatus('Failed to save data', 'error');
            }
            return success;
        } catch (error) {
            console.error('Save data error:', error);
            this.showStatus('Error saving data', 'error');
            return false;
        } finally {
            this.setLoading(false);
        }
    }

    async loadHospitals() {
        if (!this.firebaseAuth) return [];

        try {
            const response = await this.firebaseAuth.apiCall('/api/hospitals');
            if (response.ok) {
                const result = await response.json();
                return result.hospitals || [];
            }
        } catch (error) {
            console.error('Error loading hospitals:', error);
        }
        return [];
    }

    async addHospital(hospital) {
        if (!this.firebaseAuth) return false;

        try {
            const response = await this.firebaseAuth.apiCall('/api/hospitals', {
                method: 'POST',
                body: JSON.stringify(hospital)
            });
            
            if (response.ok) {
                const newHospital = await response.json();
                this.data.hospitals.push(newHospital);
                await this.saveData();
                return true;
            }
        } catch (error) {
            console.error('Error adding hospital:', error);
        }
        return false;
    }

    handleInteraction(type, index, action) {
        if (!this.data[type] || !this.data[type][index]) return;

        const item = this.data[type][index];
        
        switch (action) {
            case 'toggle':
                item.visited = !item.visited;
                if (item.visited) {
                    item.visitDate = new Date().toISOString().split('T')[0];
                } else {
                    delete item.visitDate;
                }
                break;
            case 'delete':
                this.data[type].splice(index, 1);
                break;
            case 'edit':
                // Implement edit functionality
                break;
        }

        // Auto-save after interaction
        this.saveData();
    }

    addMedicalRecord(record) {
        this.data.medicalRecords.push({
            ...record,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        });
    }

    // Status and loading callbacks
    onStatus(callback) {
        this.onStatusCallback = callback;
    }

    onLoading(callback) {
        this.onLoadingCallback = callback;
    }

    showStatus(message, type = 'info') {
        if (this.onStatusCallback) {
            this.onStatusCallback(message, type);
        }
    }

    setLoading(loading, text = '') {
        if (this.onLoadingCallback) {
            this.onLoadingCallback(loading, text);
        }
    }
}
