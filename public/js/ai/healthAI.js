export class HealthAI {
    constructor() {
        this.apiEndpoint = '/api/ai/analyze';
        this.enabled = false;
        this.modelVersion = '1.0.0';
        this.analysisCache = new Map();
    }

    async initialize() {
        try {
            const settings = await this.loadSettings();
            this.enabled = settings.aiEnabled || false;
            console.log('Health AI initialized:', this.enabled ? 'enabled' : 'disabled');
            return true;
        } catch (error) {
            console.error('Failed to initialize Health AI:', error);
            return false;
        }
    }

    async loadSettings() {
        const stored = localStorage.getItem('healthai_settings');
        return stored ? JSON.parse(stored) : { aiEnabled: false };
    }

    async saveSettings(settings) {
        localStorage.setItem('healthai_settings', JSON.stringify(settings));
        this.enabled = settings.aiEnabled;
    }

    async analyzeSymptoms(symptoms, conditions = []) {
        if (!this.enabled) {
            return this.getMockAnalysis();
        }

        const cacheKey = `symptoms_${JSON.stringify(symptoms)}_${JSON.stringify(conditions)}`;
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'symptom_analysis',
                    data: { symptoms, conditions }
                })
            });

            if (!response.ok) {
                throw new Error('AI analysis failed');
            }

            const analysis = await response.json();
            this.analysisCache.set(cacheKey, analysis);
            
            setTimeout(() => this.analysisCache.delete(cacheKey), 300000);

            return analysis;
        } catch (error) {
            console.error('AI analysis error:', error);
            return this.getMockAnalysis();
        }
    }

    async analyzeConditionTrends(conditionData, timeframe = '30d') {
        if (!this.enabled) {
            return null;
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'condition_trends',
                    data: { conditionData, timeframe }
                })
            });

            if (!response.ok) {
                throw new Error('Trend analysis failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Trend analysis error:', error);
            return null;
        }
    }

    async getMedicationInteractions(medications) {
        if (!this.enabled || medications.length === 0) {
            return null;
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'medication_interactions',
                    data: { medications }
                })
            });

            if (!response.ok) {
                throw new Error('Interaction check failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Medication interaction check error:', error);
            return null;
        }
    }

    async getHealthInsights(userData) {
        if (!this.enabled) {
            return this.getMockInsights();
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'health_insights',
                    data: userData
                })
            });

            if (!response.ok) {
                throw new Error('Insights generation failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Health insights error:', error);
            return this.getMockInsights();
        }
    }

    getMockAnalysis() {
        return {
            severity: 'low',
            urgency: 'routine',
            recommendations: [
                'Monitor symptoms for 24-48 hours',
                'Stay hydrated and get adequate rest',
                'Contact your healthcare provider if symptoms worsen'
            ],
            relatedConditions: [],
            confidence: 0.75,
            disclaimer: 'This is not medical advice. Consult a healthcare professional for diagnosis.'
        };
    }

    getMockInsights() {
        return {
            insights: [
                'Your symptom tracking shows consistency',
                'Consider logging medication adherence',
                'Regular monitoring detected'
            ],
            suggestions: [
                'Add more detail to symptom descriptions',
                'Track symptom severity over time'
            ]
        };
    }

    clearCache() {
        this.analysisCache.clear();
    }

    getStatus() {
        return {
            enabled: this.enabled,
            modelVersion: this.modelVersion,
            cacheSize: this.analysisCache.size
        };
    }
}

export const healthAI = new HealthAI();
