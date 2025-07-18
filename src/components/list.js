// List Rendering and Management for Hospital Tracker Application
export class ListRenderer {
    constructor() {
        this.dataManager = null;
    }

    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }

    renderList(type, data, searchTerm = '') {
        const listElement = document.getElementById(`${type}-list`);
        if (!listElement) {
            console.error(`List element for ${type} not found`);
            return;
        }

        listElement.innerHTML = '';
        let filteredData = (data || []).filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        filteredData.sort((a, b) => b.visited - a.visited);

        if (filteredData.length === 0) {
            listElement.innerHTML = `<p class="text-gray-500">No matching ${type}.</p>`;
            return;
        }

        // Show only first 10 by default, with option to show more
        const showAll = listElement.dataset.showAll === 'true';
        const itemsToShow = showAll ? filteredData : filteredData.slice(0, 10);

        itemsToShow.forEach((item) => {
            const index = data.findIndex(d => d.name === item.name);
            const itemElement = document.createElement('div');
            itemElement.className = 'list-item flex items-center justify-between p-2 rounded-lg border';
            itemElement.classList.toggle('bg-green-50', item.visited);
            itemElement.classList.toggle('border-green-200', item.visited);

            let cityHTML = '';
            if (type === 'hospitals' && item.city) {
                cityHTML = `<span class="text-xs text-gray-500">${item.city}</span>`;
            }

            itemElement.innerHTML = `
                <div class="flex items-center flex-grow min-w-0">
                    <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0" ${item.visited ? 'checked' : ''} data-type="${type}" data-index="${index}">
                    <div class="ml-3 flex flex-col">
                       <span class="text-sm truncate ${item.visited ? 'line-through text-gray-500' : 'text-gray-700'}" title="${item.name}">${item.name}</span>
                       ${cityHTML}
                    </div>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold w-6 h-6 rounded-full transition-colors text-sm" data-action="decrease" data-type="${type}" data-index="${index}">-</button>
                    <span class="font-medium text-sm w-6 text-center">${item.count}</span>
                    <button class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold w-6 h-6 rounded-full transition-colors text-sm" data-action="increase" data-type="${type}" data-index="${index}">+</button>
                </div>`;
            listElement.appendChild(itemElement);
        });

        // Add show more/less button if needed
        if (filteredData.length > 10) {
            const toggleButton = document.createElement('button');
            toggleButton.className = 'w-full mt-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors';
            toggleButton.textContent = showAll ? `Show Less (${filteredData.length - 10} hidden)` : `Show All ${filteredData.length} ${type}`;

            toggleButton.addEventListener('click', () => {
                listElement.dataset.showAll = showAll ? 'false' : 'true';
                this.renderList(type, data, searchTerm);
            });

            listElement.appendChild(toggleButton);
        }
    }

    renderStats(type, data) {
        const statsElement = document.getElementById(`${type}-stats`);
        if (!statsElement) return;

        if (!data || data.length === 0) {
            statsElement.innerHTML = '';
            return;
        }
        
        const total = data.length;
        const visited = data.filter(item => item.visited).length;
        const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
        const totalVisits = data.reduce((sum, item) => sum + item.count, 0);
        
        statsElement.innerHTML = `
            <div class="space-y-2">
                <p class="text-sm font-medium text-gray-600"><span class="font-bold text-gray-800">${visited}</span> of <span class="font-bold text-gray-800">${total}</span> visited (${percentage}%)</p>
                <div class="w-full bg-gray-200 rounded-full h-2.5"><div class="bg-blue-600 h-2.5 rounded-full progress-bar-fill" style="width: ${percentage}%"></div></div>
                <p class="text-sm font-medium text-gray-600">Total individual visits: <span class="font-bold text-gray-800">${totalVisits}</span></p>
            </div>`;
    }

    renderRecentActivity(activities) {
        const container = document.getElementById('recent-activity-section');
        if (!container || !activities || activities.length === 0) {
            if (container) container.innerHTML = '';
            return;
        }

        const sectionHTML = `
            <div class="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div>
                        <h3 class="text-lg font-semibold text-blue-900">🕒 Recent Activity</h3>
                        <p class="text-sm text-blue-700">Your latest symptom logs and medical records</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${activities.map(act => this.renderActivityCard(act)).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = sectionHTML;
    }

    renderActivityCard(activity) {
        const date = new Date(activity.date);
        const displayDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        const notes = activity.entry.notes ? `<div class="text-xs text-gray-700 mt-1 italic">"${activity.entry.notes}"</div>` : '';

        if (activity.type === 'symptom') {
            const conditions = Object.keys(activity.entry.conditions || {}).map(c => 
                `<span class="inline-block bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs mr-1 capitalize">${c.replace(/_/g, ' ')}</span>`
            ).join('');
            
            return `
                <div class="bg-white p-3 rounded-lg border border-blue-200 flex flex-col">
                    <div class="flex-grow">
                        <div class="font-medium text-blue-900 text-sm mb-1">Symptom Log</div>
                        <div class="text-xs text-gray-600 mb-2">${displayDate}</div>
                        <div class="mb-1 flex flex-wrap gap-1">${conditions || '<span class="text-xs text-gray-500">General log</span>'}</div>
                    </div>
                    ${notes}
                </div>
            `;
        } else { // 'record'
            const visitType = activity.entry.visitType ? 
                `<span class="inline-block bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs mr-1 capitalize">${activity.entry.visitType}</span>` : '';
            
            return `
                <div class="bg-white p-3 rounded-lg border border-green-200 flex flex-col">
                    <div class="flex-grow">
                        <div class="font-medium text-green-900 text-sm mb-1">Medical Record</div>
                        <div class="text-xs text-gray-600 mb-2">${displayDate}</div>
                        <div class="font-semibold text-xs text-gray-800 mb-2">${activity.entry.hospital || 'Unknown Facility'}</div>
                        <div class="mb-1 flex flex-wrap gap-1">${visitType}</div>
                    </div>
                    ${notes}
                </div>
            `;
        }
    }

    setupEventListeners() {
        // Set up event listeners for list interactions
        const hospitalsList = document.getElementById('hospitals-list');
        const ambulanceList = document.getElementById('ambulance-list');
        const hospitalSearch = document.getElementById('hospital-search');
        const ambulanceSearch = document.getElementById('ambulance-search');

        if (hospitalsList && this.dataManager) {
            hospitalsList.addEventListener('click', (e) => {
                if (this.dataManager.handleInteraction(e)) {
                    // Data changed, trigger re-render
                    this.renderAll();
                }
            });
        }

        if (ambulanceList && this.dataManager) {
            ambulanceList.addEventListener('click', (e) => {
                if (this.dataManager.handleInteraction(e)) {
                    // Data changed, trigger re-render
                    this.renderAll();
                }
            });
        }

        if (hospitalSearch && this.dataManager) {
            hospitalSearch.addEventListener('input', (e) => {
                const data = this.dataManager.getData();
                this.renderList('hospitals', data.hospitals, e.target.value);
            });
        }

        if (ambulanceSearch && this.dataManager) {
            ambulanceSearch.addEventListener('input', (e) => {
                const data = this.dataManager.getData();
                this.renderList('ambulance', data.ambulance, e.target.value);
            });
        }
    }

    renderAll() {
        if (!this.dataManager) return;
        
        const data = this.dataManager.getData();
        
        // Render hospitals
        const hospitalSearch = document.getElementById('hospital-search');
        const hospitalSearchTerm = hospitalSearch ? hospitalSearch.value : '';
        this.renderList('hospitals', data.hospitals || [], hospitalSearchTerm);
        this.renderStats('hospitals', data.hospitals || []);
        
        // Render ambulance
        const ambulanceSearch = document.getElementById('ambulance-search');
        const ambulanceSearchTerm = ambulanceSearch ? ambulanceSearch.value : '';
        this.renderList('ambulance', data.ambulance || [], ambulanceSearchTerm);
        this.renderStats('ambulance', data.ambulance || []);
        
        // Render recent activity
        const recentActivity = this.dataManager.getRecentActivity();
        this.renderRecentActivity(recentActivity);
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