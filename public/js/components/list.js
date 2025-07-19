// List Rendering and Management for Hospital Tracker Application
export class ListRenderer {
    constructor() {
        this.dataManager = null;
    }

    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    renderAll() {
        if (!this.dataManager) {
            console.warn('DataManager not set, cannot render lists');
            return;
        }

        const data = this.dataManager.getData();
        
        // Render hospitals list
        this.renderList('hospitals', data.hospitals || []);
        
        // Render ambulance list
        this.renderList('ambulance', data.ambulance || []);
        
        // Render medical records
        this.renderMedicalRecords(data.medicalRecords || []);
        
        console.log('All lists rendered successfully');
    }

    renderList(type, data, searchTerm = '') {
        const containerId = type === 'hospitals' ? 'hospitals-list' : 'ambulance-list';
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        // Filter data based on search term
        let filteredData = data;
        if (searchTerm) {
            filteredData = data.filter(item => 
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.location?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        container.innerHTML = '';

        if (!filteredData || filteredData.length === 0) {
            container.innerHTML = `
                <div class="text-gray-500 text-center py-8">
                    <p>No ${type} found${searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                </div>
            `;
            return;
        }

        filteredData.forEach((item, index) => {
            const listItem = this.createListItem(type, item, index);
            container.appendChild(listItem);
        });
    }

    createListItem(type, item, index) {
        const listItem = document.createElement('div');
        listItem.className = 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow';
        
        const isVisited = item.visited || false;
        const visitDate = item.visitDate || '';
        
        listItem.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1">
                    <div class="flex-shrink-0 mt-1">
                        <input 
                            type="checkbox" 
                            ${isVisited ? 'checked' : ''} 
                            data-type="${type}" 
                            data-index="${index}" 
                            data-action="toggle"
                            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        >
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-medium text-gray-900 ${isVisited ? 'line-through text-gray-500' : ''}">
                            ${item.name || 'Unnamed Location'}
                        </h4>
                        <p class="text-sm text-gray-600 mt-1">
                            ${item.location || 'No location specified'}
                        </p>
                        ${item.type ? `<p class="text-xs text-gray-500 mt-1">Type: ${item.type}</p>` : ''}
                        ${isVisited && visitDate ? `<p class="text-xs text-green-600 mt-1">Visited: ${visitDate}</p>` : ''}
                    </div>
                </div>
                <div class="flex-shrink-0 ml-4">
                    <div class="flex space-x-2">
                        <button 
                            data-type="${type}" 
                            data-index="${index}" 
                            data-action="edit"
                            class="text-blue-600 hover:text-blue-800 text-sm"
                            title="Edit"
                        >
                            ✏️
                        </button>
                        <button 
                            data-type="${type}" 
                            data-index="${index}" 
                            data-action="delete"
                            class="text-red-600 hover:text-red-800 text-sm"
                            title="Delete"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return listItem;
    }

    renderMedicalRecords(records) {
        const container = document.getElementById('medical-records-list');
        if (!container) {
            console.warn('Medical records container not found');
            return;
        }

        container.innerHTML = '';

        if (!records || records.length === 0) {
            container.innerHTML = `
                <div class="text-gray-500 text-center py-8">
                    <p>No medical records found.</p>
                    <p class="text-sm mt-2">Add your first record to get started!</p>
                </div>
            `;
            return;
        }

        records.forEach((record, index) => {
            const recordItem = this.createMedicalRecordItem(record, index);
            container.appendChild(recordItem);
        });
    }

    createMedicalRecordItem(record, index) {
        const recordItem = document.createElement('div');
        recordItem.className = 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3';
        
        const date = new Date(record.date || record.createdAt).toLocaleDateString();
        
        recordItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h4 class="text-lg font-medium text-gray-900">${record.title || 'Medical Visit'}</h4>
                    <p class="text-sm text-gray-600 mt-1">${date}</p>
                    ${record.hospital ? `<p class="text-sm text-gray-600">Hospital: ${record.hospital}</p>` : ''}
                    ${record.reason ? `<p class="text-sm text-gray-700 mt-2">${record.reason}</p>` : ''}
                    ${record.diagnosis ? `<p class="text-sm text-blue-600 mt-2">Diagnosis: ${record.diagnosis}</p>` : ''}
                </div>
                <div class="flex space-x-2">
                    <button 
                        data-type="medicalRecords" 
                        data-index="${index}" 
                        data-action="edit"
                        class="text-blue-600 hover:text-blue-800 text-sm"
                        title="Edit Record"
                    >
                        ✏️
                    </button>
                    <button 
                        data-type="medicalRecords" 
                        data-index="${index}" 
                        data-action="delete"
                        class="text-red-600 hover:text-red-800 text-sm"
                        title="Delete Record"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        `;
        
        return recordItem;
    }
}

// Legacy functions for backward compatibility - no duplicates
export function renderList(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No records found.</p>';
        return;
    }

    data.forEach(item => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.innerHTML = `
            <h4>${item.title || item.name || 'Untitled'}</h4>
            <p>${item.description || item.location || 'No description available.'}</p>
        `;
        container.appendChild(listItem);
    });
}

export function renderSymptoms(symptoms) {
    renderList(symptoms, 'symptoms-list');
}