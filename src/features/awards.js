// Awards and Gamification System
export class AwardsManager {
    constructor() {
        this.awardsDefinition = {
            'first_visit': { name: 'First Visit!', description: 'Log your first visit to any location.', icon: '&#127881;' },
            'hospitals_5': { name: 'Hospital Hopper', description: 'Visit 5 different hospitals.', icon: '&#127973;' },
            'hospitals_10': { name: 'Hospital Hero', description: 'Visit 10 different hospitals.', icon: '&#129661;' },
            'trusts_all': { name: 'Trust Titan', description: 'Visit every ambulance trust.', icon: '&#128657;' },
            'visits_100': { name: 'Century Club', description: 'Accumulate 100 total visits.', icon: '&#127941;' }
        };
        
        this.statusCallback = null;
    }

    onStatus(callback) {
        this.statusCallback = callback;
    }

    showStatus(message, type = 'success') {
        if (this.statusCallback) {
            this.statusCallback(message, type);
        }
    }

    checkAwards(localData) {
        if (!localData) return;

        const visitedHospitals = (localData.hospitals || []).filter(h => h.visited).length;
        const visitedAmbulance = (localData.ambulance || []).filter(a => a.visited).length;
        const totalVisits = (localData.hospitals || []).reduce((s, h) => s + h.count, 0) + 
                           (localData.ambulance || []).reduce((s, a) => s + a.count, 0);

        if (!localData.awards) localData.awards = [];

        const unlock = (awardId) => {
            if (!localData.awards.includes(awardId)) {
                localData.awards.push(awardId);
                const award = this.awardsDefinition[awardId];
                this.showStatus(`Award Unlocked: ${award.name}`, 'success');
            }
        };

        if (totalVisits > 0) unlock('first_visit');
        if (visitedHospitals >= 5) unlock('hospitals_5');
        if (visitedHospitals >= 10) unlock('hospitals_10');
        if (localData.ambulance.length > 0 && visitedAmbulance === localData.ambulance.length) unlock('trusts_all');
        if (totalVisits >= 100) unlock('visits_100');
    }

    generateAwardsModal(localData) {
        let awardsContent = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">';
        
        for (const id in this.awardsDefinition) {
            const award = this.awardsDefinition[id];
            const unlocked = (localData.awards || []).includes(id);
            awardsContent += `
                <div class="award p-4 border rounded-lg ${unlocked ? 'unlocked' : ''}">
                    <div class="text-5xl">${award.icon}</div>
                    <h4 class="font-bold mt-2">${award.name}</h4>
                    <p class="text-sm text-gray-600">${award.description}</p>
                </div>`;
        }
        
        awardsContent += '</div>';
        return awardsContent;
    }

    getAwardsDefinition() {
        return this.awardsDefinition;
    }
}
