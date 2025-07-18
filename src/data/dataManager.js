// Data Manager for Hospital Tracker Application
export class DataManager {
    constructor() {
        this.localData = {};
        this.firebaseAuth = null;
        this.statusCallback = null;
        this.loadingCallback = null;
    }

    setFirebaseAuth(auth) { this.firebaseAuth = auth; }
    onStatus(callback) { this.statusCallback = callback; }
    onLoading(callback) { this.loadingCallback = callback; }
    showStatus(msg, type) { if (this.statusCallback) this.statusCallback(msg, type); }
    setLoading(loading, text) { if (this.loadingCallback) this.loadingCallback(loading, text); }

    getData() { return this.localData; }
    setData(data) {
        this.localData = {
            hospitals: [], ambulance: [], awards: [], visitHistory: [],
            medicalRecords: [], symptomTracking: [], userProfile: {}, ...data
        };
    }

    async initializeDefaultData() {
        this.setLoading(true, 'Setting up your account...');
        const hospitals = await this.loadListFromFile('hospitals');
        const ambulance = await this.loadListFromFile('ambulance');
        this.localData = {
            hospitals, ambulance, awards: [], visitHistory: [],
            medicalRecords: [], symptomTracking: [], userProfile: {}
        };
        await this.saveData();
        this.setLoading(false);
    }

    async loadListFromFile(type) {
        try {
            const isHospital = type === 'hospitals';
            const url = isHospital ? 'hospital_data.json' : 'ambulance.txt';
            this.setLoading(true, `Loading ${type}...`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Could not load '${url}'.`);

            if (isHospital) {
                const data = await response.json();
                return data.map(h => ({ name: h.name, visited: false, count: 0, coords: h.coords, city: h.city }));
            } else {
                const text = await response.text();
                const lines = text.split(/\r\n?|\n/).filter(line => line.trim());
                const list = [];
                for (const name of lines) {
                    const coords = await this.geocodeLocation(name);
                    list.push({ name, visited: false, count: 0, coords });
                    await new Promise(r => setTimeout(r, 250)); // Rate limit geocoding
                }
                return list;
            }
        } catch (error) {
            this.showStatus(error.message, "error");
            this.setLoading(false);
            return [];
        }
    }

    async geocodeLocation(name) {
        try {
            const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`);
            const data = await r.json();
            return data?.[0] ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    async saveData() {
        if (!this.firebaseAuth) return false;
        const success = await this.firebaseAuth.saveData(this.localData);
        if (success) {
            this.showStatus("Data saved!", "success");
        } else {
            this.showStatus("Error saving data.", "error");
        }
        return success;
    }

    handleInteraction(type, index, action) {
        const item = this.localData[type]?.[index];
        if (!item) return;

        if (action === 'toggle') {
            item.visited = !item.visited;
            if (item.visited && item.count === 0) item.count = 1;
        } else if (action === 'increase') {
            item.count++;
            if (item.count > 0) item.visited = true;
        } else if (action === 'decrease' && item.count > 0) {
            item.count--;
            if (item.count === 0) item.visited = false;
        }
        this.saveData();
    }
    
    addMedicalRecord(record) {
        if (!this.localData.medicalRecords) this.localData.medicalRecords = [];
        record.id = `rec_${Date.now()}`;
        record.timestamp = new Date().toISOString();
        this.localData.medicalRecords.unshift(record);
    }
}
