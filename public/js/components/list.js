// List Rendering and Management for Hospital Tracker Application
export class ListRenderer {
    constructor() {
        this.dataManager = null;
    }

    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    renderAll() {
        console.log('Rendering all lists');
    }

    renderList(type, data, searchTerm = '') {
        console.log(`Rendering ${type} list`);
    }
}

// Legacy functions for backward compatibility
export function renderList(data, containerId) {
    const listRenderer = new ListRenderer();
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
            <h4>${item.title || 'Untitled'}</h4>
            <p>${item.description || 'No description available.'}</p>
        `;
        container.appendChild(listItem);
    });
}

export function renderMedicalRecords(records) {
    renderList(records, 'medical-records-list');
}

export function renderSymptoms(symptoms) {
    renderList(symptoms, 'symptoms-list');
}

export { renderMedicalRecords, renderSymptoms };