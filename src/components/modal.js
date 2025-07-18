// Modal Management for Hospital Tracker Application
export class ModalManager {
    constructor() {
        this.modalContainer = null;
    }

    initialize() {
        this.modalContainer = document.getElementById('modal-container');
        if (!this.modalContainer) {
            console.error('Modal container not found');
            return false;
        }
        return true;
    }

    createModal(id, title, content, size = 'max-w-4xl') {
        if (!this.modalContainer) {
            console.error('Modal container not initialized');
            return null;
        }

        const modalHTML = `
            <div id="${id}" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 opacity-0 modal-backdrop">
                <div class="bg-white rounded-xl shadow-2xl p-6 w-full ${size} modal-content transform scale-95">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-900">${title}</h2>
                        <button class="close-modal-btn text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                    </div>
                    <div>${content}</div>
                </div>
            </div>`;
        
        this.modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById(id);

        // Handle close button clicks
        modal.querySelector('.close-modal-btn').addEventListener('click', () => this.closeModal(modal));

        // Handle backdrop clicks
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });

        return modal;
    }

    openModal(modal) {
        if (!modal) return;
        
        modal.classList.remove('hidden', 'opacity-0');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
        }, 10);
    }

    closeModal(modal) {
        if (!modal) return;
        
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    showHelpModal() {
        const helpContent = `
            <div class="space-y-4">
                <h2 class="text-xl font-bold mb-2">Help & Support</h2>
                <p>Welcome to myHealthTracker! Here you can track your medical visits, symptoms, and more. If you have questions or need support, check the FAQ or contact us.</p>
                <ul class="list-disc pl-6 text-sm text-gray-700">
                    <li>To add a new record, click the <b>Add Record</b> button.</li>
                    <li>To log symptoms, use the <b>Log Symptoms</b> button on your dashboard or profile.</li>
                    <li>Update your profile and tracked conditions from the profile page.</li>
                </ul>
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <h3 class="font-semibold text-yellow-800 mb-1">Work In Progress</h3>
                    <p class="text-yellow-900 text-sm">This is a work-in-progress project. Features and data may change. Thank you for your feedback and patience as we continue to improve the app!</p>
                </div>
                <button id="close-help-btn" class="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Close</button>
            </div>
        `;
        
        const modal = this.createModal('help-modal', 'Help & Support', helpContent, 'max-w-2xl');
        this.openModal(modal);
        modal.querySelector('#close-help-btn').addEventListener('click', () => this.closeModal(modal));
        return modal;
    }

    showStatsModal(localData) {
        const content = `<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div><h3 class="text-xl font-semibold text-center mb-4">Hospitals</h3><canvas id="hospitals-chart"></canvas></div>
                            <div><h3 class="text-xl font-semibold text-center mb-4">Ambulance Trusts</h3><canvas id="ambulance-chart"></canvas></div>
                         </div>`;
        
        const modal = this.createModal('stats-modal', 'Statistics', content);
        this.openModal(modal);

        // Create charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            const createPieChart = (type, data, chartId) => {
                const ctx = modal.querySelector(`#${chartId}`).getContext('2d');
                const visited = (data || []).filter(item => item.visited).length;
                const notVisited = (data || []).length - visited;
                return new Chart(ctx, { 
                    type: 'pie', 
                    data: { 
                        labels: ['Visited', 'Not Visited'], 
                        datasets: [{ 
                            data: [visited, notVisited], 
                            backgroundColor: ['#10B981', '#EF4444'], 
                            borderColor: '#ffffff', 
                            borderWidth: 2 
                        }] 
                    }, 
                    options: { 
                        responsive: true, 
                        plugins: { 
                            legend: { position: 'top' } 
                        } 
                    } 
                });
            };
            
            setTimeout(() => {
                createPieChart('hospitals', localData.hospitals, 'hospitals-chart');
                createPieChart('ambulance', localData.ambulance, 'ambulance-chart');
            }, 100);
        }

        return modal;
    }

    showMapModal(localData) {
        const modal = this.createModal('map-modal', 'Map View', '<div id="map"></div>', 'max-w-6xl');
        this.openModal(modal);

        setTimeout(() => {
            try {
                if (typeof L !== 'undefined') {
                    const map = L.map('map').setView([54.5, -2.5], 6); // Centered on UK
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(map);

                    const visitedHospitals = (localData.hospitals || []).filter(h => h.visited);
                    const visitedAmbulance = (localData.ambulance || []).filter(a => a.visited);
                    const visitedLocations = [...visitedHospitals, ...visitedAmbulance];

                    visitedLocations.forEach(loc => {
                        if (loc.coords && loc.coords.lat) {
                            const isHospital = localData.hospitals.some(h => h.name === loc.name);
                            const color = isHospital ? '#3b82f6' : '#16a34a';
                            const baseRadius = 8;
                            const radius = Math.min(baseRadius + (loc.count * 2), 20);
                            const baseOpacity = 0.6;
                            const fillOpacity = Math.min(baseOpacity + (loc.count * 0.1), 1.0);

                            L.circleMarker([loc.coords.lat, loc.coords.lon], {
                                color: color,
                                fillColor: color,
                                fillOpacity: fillOpacity,
                                radius: radius,
                                weight: 2
                            })
                                .addTo(map)
                                .bindPopup(`
                                    <div class="text-center">
                                        <b>${loc.name}</b><br>
                                        <span class="text-sm ${isHospital ? 'text-blue-600' : 'text-green-600'}">${isHospital ? 'Hospital' : 'Ambulance Trust'}</span><br>
                                        <span class="font-semibold">Visits: ${loc.count}</span>
                                    </div>
                                `);
                        }
                    });

                    if (visitedLocations.length === 0) {
                        modal.querySelector('#map').innerHTML = '<p class="text-gray-500 text-center mt-8">No visited locations to display. Start checking off hospitals and ambulance trusts to see them appear on the map!</p>';
                    }
                } else {
                    modal.querySelector('#map').innerHTML = '<p class="text-red-500 text-center">Leaflet maps library not available.</p>';
                }
            } catch (e) {
                console.error("Map initialization failed:", e);
                modal.querySelector('#map').innerHTML = '<p class="text-red-500 text-center">Sorry, the map could not be loaded.</p>';
            }
        }, 100);

        return modal;
    }
}

// Legacy exports for backward compatibility
export function createModal(id, title, content, size = 'max-w-md') {
    const modalManager = new ModalManager();
    modalManager.initialize();
    return modalManager.createModal(id, title, content, size);
}

export function openModal(modal) {
    const modalManager = new ModalManager();
    modalManager.openModal(modal);
}

export function closeModal(modal) {
    const modalManager = new ModalManager();
    modalManager.closeModal(modal);
}