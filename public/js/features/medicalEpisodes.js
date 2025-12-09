// Medical Episode Tracking System
export const MEDICAL_ISSUES = {
    CARDIOVASCULAR: {
        name: 'Cardiovascular',
        icon: '❤️',
        issues: [
            { id: 'chest_pain', name: 'Chest Pain', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'heart_attack', name: 'Heart Attack', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'stroke', name: 'Stroke', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'heart_palpitations', name: 'Heart Palpitations', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
            { id: 'high_blood_pressure', name: 'High Blood Pressure', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
            { id: 'angina', name: 'Angina', severity: 'high', requiresAmbulance: true, requiresHospital: true },
        ]
    },
    NEUROLOGICAL: {
        name: 'Neurological',
        icon: '🧠',
        issues: [
            { id: 'seizure', name: 'Seizure', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'migraine', name: 'Severe Migraine', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
            { id: 'fainting', name: 'Fainting/Loss of Consciousness', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'vertigo', name: 'Severe Vertigo', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
            { id: 'confusion', name: 'Sudden Confusion', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'memory_loss', name: 'Memory Loss', severity: 'medium', requiresAmbulance: false, requiresHospital: true },
        ]
    },
    RESPIRATORY: {
        name: 'Respiratory',
        icon: '🫁',
        issues: [
            { id: 'breathing_difficulty', name: 'Difficulty Breathing', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'asthma_attack', name: 'Asthma Attack', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'choking', name: 'Choking', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'pneumonia', name: 'Pneumonia Symptoms', severity: 'medium', requiresAmbulance: false, requiresHospital: true },
            { id: 'coughing_blood', name: 'Coughing Up Blood', severity: 'high', requiresAmbulance: true, requiresHospital: true },
        ]
    },
    TRAUMA: {
        name: 'Trauma & Injury',
        icon: '🩹',
        issues: [
            { id: 'severe_bleeding', name: 'Severe Bleeding', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'broken_bone', name: 'Broken Bone/Fracture', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'head_injury', name: 'Head Injury', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'burn', name: 'Severe Burn', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'sprain', name: 'Sprain/Strain', severity: 'low', requiresAmbulance: false, requiresHospital: false },
            { id: 'laceration', name: 'Deep Cut/Laceration', severity: 'medium', requiresAmbulance: false, requiresHospital: true },
            { id: 'fall', name: 'Fall Injury', severity: 'medium', requiresAmbulance: false, requiresHospital: true },
        ]
    },
    GASTROINTESTINAL: {
        name: 'Gastrointestinal',
        icon: '🫃',
        issues: [
            { id: 'severe_abdominal_pain', name: 'Severe Abdominal Pain', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'vomiting_blood', name: 'Vomiting Blood', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'appendicitis', name: 'Suspected Appendicitis', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'food_poisoning', name: 'Food Poisoning', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
            { id: 'gastroenteritis', name: 'Gastroenteritis', severity: 'low', requiresAmbulance: false, requiresHospital: false },
        ]
    },
    ALLERGIC: {
        name: 'Allergic Reactions',
        icon: '🤧',
        issues: [
            { id: 'anaphylaxis', name: 'Anaphylaxis', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'severe_allergic_reaction', name: 'Severe Allergic Reaction', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'allergic_rash', name: 'Allergic Rash/Hives', severity: 'low', requiresAmbulance: false, requiresHospital: false },
        ]
    },
    METABOLIC: {
        name: 'Metabolic',
        icon: '⚡',
        issues: [
            { id: 'diabetic_emergency', name: 'Diabetic Emergency', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'hypoglycemia', name: 'Low Blood Sugar', severity: 'high', requiresAmbulance: false, requiresHospital: false },
            { id: 'hyperglycemia', name: 'High Blood Sugar', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
            { id: 'dehydration', name: 'Severe Dehydration', severity: 'medium', requiresAmbulance: false, requiresHospital: true },
        ]
    },
    OBSTETRIC: {
        name: 'Obstetric/Pregnancy',
        icon: '🤰',
        issues: [
            { id: 'labor', name: 'Labor/Delivery', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'pregnancy_bleeding', name: 'Pregnancy Bleeding', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'eclampsia', name: 'Eclampsia/Pre-eclampsia', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'pregnancy_complications', name: 'Pregnancy Complications', severity: 'high', requiresAmbulance: true, requiresHospital: true },
        ]
    },
    MENTAL_HEALTH: {
        name: 'Mental Health',
        icon: '🧘',
        issues: [
            { id: 'panic_attack', name: 'Panic Attack', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
            { id: 'suicidal_thoughts', name: 'Suicidal Thoughts', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'psychotic_episode', name: 'Psychotic Episode', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'severe_anxiety', name: 'Severe Anxiety', severity: 'medium', requiresAmbulance: false, requiresHospital: false },
        ]
    },
    POISONING: {
        name: 'Poisoning/Overdose',
        icon: '☠️',
        issues: [
            { id: 'drug_overdose', name: 'Drug Overdose', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'poisoning', name: 'Poisoning', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'carbon_monoxide', name: 'Carbon Monoxide Poisoning', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'alcohol_poisoning', name: 'Alcohol Poisoning', severity: 'high', requiresAmbulance: true, requiresHospital: true },
        ]
    },
    OTHER: {
        name: 'Other Emergencies',
        icon: '🆘',
        issues: [
            { id: 'electric_shock', name: 'Electric Shock', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'drowning', name: 'Near Drowning', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
            { id: 'hypothermia', name: 'Hypothermia', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'heatstroke', name: 'Heat Stroke', severity: 'high', requiresAmbulance: true, requiresHospital: true },
            { id: 'severe_infection', name: 'Severe Infection/Sepsis', severity: 'critical', requiresAmbulance: true, requiresHospital: true },
        ]
    }
};

export class MedicalEpisodeManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    createEpisode(issueId, categoryKey) {
        const category = MEDICAL_ISSUES[categoryKey];
        if (!category) return null;

        const issue = category.issues.find(i => i.id === issueId);
        if (!issue) return null;

        return {
            id: `episode_${Date.now()}`,
            issueId: issue.id,
            issueName: issue.name,
            category: category.name,
            severity: issue.severity,
            timestamp: new Date().toISOString(),
            progression: [],
            requiresAmbulance: issue.requiresAmbulance,
            requiresHospital: issue.requiresHospital,
            status: 'active',
            notes: ''
        };
    }

    async addProgression(episodeId, progressionType, details = {}) {
        const data = this.dataManager.getData();
        const episode = data.medicalEpisodes?.find(e => e.id === episodeId);
        
        if (!episode) return false;

        const progression = {
            type: progressionType, // 'ambulance_called', 'hospital_arrival', 'treatment', 'discharge'
            timestamp: new Date().toISOString(),
            ...details
        };

        episode.progression.push(progression);

        // Auto-mark services
        if (progressionType === 'ambulance_called' && details.serviceName) {
            await this.markAmbulanceService(details.serviceName);
        }

        if (progressionType === 'hospital_arrival' && details.hospitalName) {
            await this.markHospitalVisit(details.hospitalName);
        }

        await this.dataManager.saveUserData();
        return true;
    }

    async markAmbulanceService(serviceName) {
        const data = this.dataManager.getData();
        const ambulance = data.ambulance?.find(a => 
            a.name.toLowerCase().includes(serviceName.toLowerCase())
        );

        if (ambulance) {
            ambulance.visited = true;
            ambulance.count = (ambulance.count || 0) + 1;
            ambulance.lastVisit = new Date().toISOString();
        }
    }

    async markHospitalVisit(hospitalName) {
        const data = this.dataManager.getData();
        const hospital = data.hospitals?.find(h => 
            h.name.toLowerCase().includes(hospitalName.toLowerCase())
        );

        if (hospital) {
            hospital.visited = true;
            hospital.count = (hospital.count || 0) + 1;
            hospital.lastVisit = new Date().toISOString();
        }
    }

    async saveEpisode(episode) {
        const data = this.dataManager.getData();
        if (!data.medicalEpisodes) {
            data.medicalEpisodes = [];
        }
        data.medicalEpisodes.push(episode);
        await this.dataManager.saveUserData();
        return episode;
    }

    getEpisodesByDateRange(startDate, endDate) {
        const data = this.dataManager.getData();
        return (data.medicalEpisodes || []).filter(e => {
            const episodeDate = new Date(e.timestamp);
            return episodeDate >= startDate && episodeDate <= endDate;
        });
    }

    getRecentEpisodes(limit = 10) {
        const data = this.dataManager.getData();
        return (data.medicalEpisodes || [])
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
}
