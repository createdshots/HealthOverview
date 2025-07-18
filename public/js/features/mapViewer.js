// Map viewer for displaying visited hospitals and ambulance services
import { showModal, hideModal } from '../components/modal.js';
import { showStatusMessage } from '../utils/ui.js';

export class MapViewer {
    constructor() {
        this.map = null;
        this.dataManager = null;
    }

    // Set data manager reference
    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    // Show the map modal with visited locations
    showMapModal() {
        if (!this.dataManager) {
            showStatusMessage('Data manager not initialized', 'error');
            return;
        }

        const modalContent = this.generateMapModalHTML();
        showModal(modalContent, true);
        
        // Initialize map after modal is shown
        setTimeout(() => {
            this.initializeMap();
        }, 200);
    }

    // Generate the map modal HTML
    generateMapModalHTML() {
        return `
            <div class="bg-gradient-to-r from-emerald-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">🗺️ Your Health Journey Map</h2>
                        <p class="text-blue-100">Visualize your visited hospitals and ambulance services</p>
                    </div>
                    <button onclick="hideModal()" class="text-white hover:text-gray-300 text-2xl font-bold transition-colors">
                        ×
                    </button>
                </div>
            </div>
            
            <div class="p-6">
                <!-- Map Legend -->
                <div class="mb-4 flex flex-wrap gap-4 justify-center bg-gray-50 p-4 rounded-lg">
                    <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span class="text-sm font-medium text-gray-700">🏥 Hospitals</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span class="text-sm font-medium text-gray-700">🚑 Ambulance Services</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-600">💡 Marker size indicates visit frequency</span>
                    </div>
                </div>
                
                <!-- Map Container -->
                <div id="health-map" class="w-full h-96 rounded-lg border border-gray-300 bg-gray-100"></div>
                
                <!-- Stats Summary -->
                <div id="map-stats" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Stats will be populated by JavaScript -->
                </div>
            </div>
        `;
    }

    // Initialize the Leaflet map
    initializeMap() {
        try {
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }

            const mapContainer = document.getElementById('health-map');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }

            // Initialize map centered on UK
            this.map = L.map('health-map').setView([54.5, -2.5], 6);

            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
            }).addTo(this.map);

            // Get data and add markers
            this.addLocationMarkers();
            this.updateMapStats();

        } catch (error) {
            console.error('Map initialization failed:', error);
            this.showMapError(error.message);
        }
    }

    // Add markers for visited locations
    addLocationMarkers() {
        const data = this.dataManager.getData();
        const visitedHospitals = (data.hospitals || []).filter(h => h.visited);
        const visitedAmbulance = (data.ambulance || []).filter(a => a.visited);

        console.log('Adding markers for:', visitedHospitals.length, 'hospitals and', visitedAmbulance.length, 'ambulance services');

        let markersAdded = 0;
        const bounds = [];

        // Add hospital markers
        visitedHospitals.forEach(hospital => {
            if (this.addMarker(hospital, 'hospital')) {
                markersAdded++;
                if (hospital.coords) {
                    bounds.push([hospital.coords.lat, hospital.coords.lon]);
                }
            }
        });

        // Add ambulance service markers
        visitedAmbulance.forEach(ambulance => {
            if (this.addMarker(ambulance, 'ambulance')) {
                markersAdded++;
                if (ambulance.coords) {
                    bounds.push([ambulance.coords.lat, ambulance.coords.lon]);
                }
            }
        });

        // Fit map to show all markers if any were added
        if (bounds.length > 0) {
            this.map.fitBounds(bounds, { padding: [20, 20] });
        }

        // Show message if no markers
        if (markersAdded === 0) {
            this.showNoMarkersMessage();
        }

        console.log('Total markers added:', markersAdded);
    }

    // Add a single marker to the map
    addMarker(location, type) {
        if (!location.coords || !location.coords.lat || !location.coords.lon) {
            console.log(`No coordinates for ${location.name}, skipping marker`);
            return false;
        }

        const isHospital = type === 'hospital';
        const color = isHospital ? '#3b82f6' : '#16a34a';
        const count = location.count || 1;

        // Calculate marker size based on visit count
        const baseRadius = 8;
        const radius = Math.min(baseRadius + (count * 2), 20);
        const fillOpacity = Math.min(0.6 + (count * 0.1), 1.0);

        // Create marker
        const marker = L.circleMarker([location.coords.lat, location.coords.lon], {
            color: color,
            fillColor: color,
            fillOpacity: fillOpacity,
            radius: radius,
            weight: 2
        }).addTo(this.map);

        // Create popup content
        const popupContent = `
            <div class="text-center p-2">
                <div class="flex items-center justify-center mb-2">
                    <span class="text-2xl mr-2">${isHospital ? '🏥' : '🚑'}</span>
                    <strong class="text-lg">${location.name}</strong>
                </div>
                <div class="text-sm ${isHospital ? 'text-blue-600' : 'text-green-600'} mb-2">
                    ${isHospital ? 'Hospital' : 'Ambulance Service'}
                </div>
                ${location.city ? `<div class="text-sm text-gray-600 mb-2">📍 ${location.city}</div>` : ''}
                <div class="font-semibold text-lg ${count > 1 ? 'text-orange-600' : 'text-gray-700'}">
                    ${count} visit${count !== 1 ? 's' : ''}
                </div>
                ${location.lastVisit ? `
                    <div class="text-xs text-gray-500 mt-1">
                        Last visit: ${new Date(location.lastVisit).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
        `;

        marker.bindPopup(popupContent);

        return true;
    }

    // Update statistics display
    updateMapStats() {
        const data = this.dataManager.getData();
        const visitedHospitals = (data.hospitals || []).filter(h => h.visited);
        const visitedAmbulance = (data.ambulance || []).filter(a => a.visited);
        
        const totalHospitalVisits = visitedHospitals.reduce((sum, h) => sum + (h.count || 1), 0);
        const totalAmbulanceVisits = visitedAmbulance.reduce((sum, a) => sum + (a.count || 1), 0);

        const statsContainer = document.getElementById('map-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="bg-blue-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-blue-600">${visitedHospitals.length}</div>
                    <div class="text-sm text-blue-800">Hospitals Visited</div>
                    <div class="text-xs text-blue-600">${totalHospitalVisits} total visits</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-green-600">${visitedAmbulance.length}</div>
                    <div class="text-sm text-green-800">Ambulance Services</div>
                    <div class="text-xs text-green-600">${totalAmbulanceVisits} total visits</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-purple-600">${visitedHospitals.length + visitedAmbulance.length}</div>
                    <div class="text-sm text-purple-800">Total Locations</div>
                    <div class="text-xs text-purple-600">on your health journey</div>
                </div>
            `;
        }
    }

    // Show error message when map fails to load
    showMapError(errorMessage) {
        const mapContainer = document.getElementById('health-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="flex items-center justify-center h-full bg-red-50 border border-red-200 rounded-lg">
                    <div class="text-center p-8">
                        <div class="text-4xl mb-4">🗺️❌</div>
                        <h3 class="text-lg font-semibold text-red-800 mb-2">Map Could Not Load</h3>
                        <p class="text-red-600 text-sm mb-4">${errorMessage}</p>
                        <button onclick="location.reload()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            Refresh Page
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Show message when no markers are available
    showNoMarkersMessage() {
        const mapContainer = document.getElementById('health-map');
        if (mapContainer) {
            // Add overlay message without removing the map
            const overlay = document.createElement('div');
            overlay.className = 'absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg';
            overlay.style.zIndex = '1000';
            overlay.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-6xl mb-4">🏥🗺️</div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">No Visits to Display</h3>
                    <p class="text-gray-600 mb-4">Start visiting hospitals and ambulance services to see them appear on your map!</p>
                    <div class="text-sm text-gray-500">
                        💡 Tip: Check off locations in your dashboard to track your health journey
                    </div>
                </div>
            `;
            
            mapContainer.style.position = 'relative';
            mapContainer.appendChild(overlay);
        }
    }

    // Clean up map instance
    cleanup() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

// Create and export singleton instance
export const mapViewer = new MapViewer();

// Export convenience function
export function showMapModal() {
    mapViewer.showMapModal();
}