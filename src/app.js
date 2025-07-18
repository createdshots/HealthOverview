// Main Application Entry Point for Hospital Tracker
import { FirebaseAuth } from './firebase/auth.js';
import { DataManager } from './data/dataManager.js';
import { ModalManager } from './components/modal.js';
import { ListRenderer } from './components/list.js';
import { AwardsManager } from './features/awards.js';
import { MedicalRecordsManager } from './features/medicalRecords.js';
import { UIManager } from './utils/ui.js';

class HospitalTrackerApp {
    constructor() {
        this.firebaseAuth = new FirebaseAuth();
        this.dataManager = new DataManager();
        this.modalManager = new ModalManager();
        this.listRenderer = new ListRenderer();
        this.awardsManager = new AwardsManager();
        this.medicalRecordsManager = new MedicalRecordsManager();
        this.uiManager = new UIManager();
        
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Initialize UI components
            this.uiManager.initialize();
            this.modalManager.initialize();
            
            // Setup callbacks
            this.setupCallbacks();
            
            // Initialize Firebase
            await this.firebaseAuth.initialize();
            
            // Setup build tracker
            this.uiManager.setupBuildTracker();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Hospital Tracker App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.uiManager.showStatusMessage('Failed to initialize application', 'error');
        }
    }

    setupCallbacks() {
        // Data Manager callbacks
        this.dataManager.setFirebaseAuth(this.firebaseAuth);
        this.dataManager.onStatus((message, type) => {
            this.uiManager.showStatusMessage(message, type);
        });
        this.dataManager.onLoading((isLoading, text) => {
            this.uiManager.setLoading(isLoading, text);
        });

        // Awards Manager callbacks
        this.awardsManager.onStatus((message, type) => {
            this.uiManager.showStatusMessage(message, type);
        });

        // List Renderer setup
        this.listRenderer.setDataManager(this.dataManager);

        // Medical Records Manager setup
        this.medicalRecordsManager.setDataManager(this.dataManager);

        // Firebase Auth callbacks
        this.firebaseAuth.onAuthChange(({ user, userId, error }) => {
            if (error) {
                this.uiManager.showStatusMessage(error, 'error');
                this.uiManager.setLoading(false);
                return;
            }

            if (user && userId) {
                this.uiManager.updateUserDisplay(user, userId);
                this.uiManager.setLoading(true, 'Connecting to your data...');
            }
        });

        this.firebaseAuth.onDataChange(async ({ data, exists, error }) => {
            if (error) {
                this.uiManager.showStatusMessage(error, 'error');
                this.uiManager.setLoading(false);
                return;
            }

            if (exists && data) {
                // Merge existing data with loaded data
                this.dataManager.setData(data);
                this.renderAll();
                this.uiManager.setLoading(false);
            } else {
                // Document doesn't exist, initialize with default data
                this.uiManager.showStatusMessage('No user data found. Importing default hospitals and ambulances...', 'error');
                await this.dataManager.initializeDefaultData();
                
                // After initializing, get the new data
                const newData = await this.firebaseAuth.getCurrentUserDoc();
                if (newData) {
                    this.dataManager.setData(newData);
                    this.renderAll();
                    this.uiManager.showStatusMessage('Default data imported successfully!', 'success');
                } else {
                    this.uiManager.showStatusMessage('Failed to import default data. Please refresh or contact support.', 'error');
                }
                this.uiManager.setLoading(false);
            }
        });
    }

    setupEventListeners() {
        // Help button
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.modalManager.showHelpModal();
            });
        }

        // Profile button
        const profileBtn = document.getElementById('show-profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                window.location.href = '/profile.html';
            });
        }

        // Add record button
        const addRecordBtn = document.getElementById('add-record-btn');
        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => {
                this.showAddRecordModal();
            });
        }

        // Stats button
        const statsBtn = document.getElementById('show-stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                const localData = this.dataManager.getData();
                this.modalManager.showStatsModal(localData);
            });
        }

        // Map button
        const mapBtn = document.getElementById('show-map-btn');
        if (mapBtn) {
            mapBtn.addEventListener('click', () => {
                const localData = this.dataManager.getData();
                this.modalManager.showMapModal(localData);
            });
        }

        // Awards button
        const awardsBtn = document.getElementById('show-awards-btn');
        if (awardsBtn) {
            awardsBtn.addEventListener('click', () => {
                this.showAwardsModal();
            });
        }

        // Setup list event listeners
        this.listRenderer.setupEventListeners();
    }

    showAddRecordModal() {
        const modalContent = this.medicalRecordsManager.createAddRecordForm();
        const modal = this.modalManager.createModal('add-record-modal', 'Add Medical Record', modalContent, 'max-w-2xl');
        this.modalManager.openModal(modal);
        this.setupAddRecordEventListeners(modal);
    }

    setupAddRecordEventListeners(modal) {
        const form = modal.querySelector('#add-record-form');
        const cancelBtn = modal.querySelector('.cancel-btn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.modalManager.closeModal(modal);
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const record = this.medicalRecordsManager.processFormData(form);
                this.dataManager.addMedicalRecord(record);
                
                await this.dataManager.saveData();
                this.modalManager.closeModal(modal);
                this.uiManager.showStatusMessage('Medical record added successfully!', 'success');
                this.renderAll();
            });

            // Toggle ambulance dropdown
            const ambulanceCheckbox = modal.querySelector('#ambulance-involved');
            const ambulanceSection = modal.querySelector('#ambulance-section');
            if (ambulanceCheckbox && ambulanceSection) {
                ambulanceCheckbox.addEventListener('change', (e) => {
                    ambulanceSection.classList.toggle('hidden', !e.target.checked);
                });
            }
        }
    }

    showAwardsModal() {
        const localData = this.dataManager.getData();
        const awardsContent = this.awardsManager.generateAwardsModal(localData);
        const modal = this.modalManager.createModal('awards-modal', 'Your Awards', awardsContent);
        this.modalManager.openModal(modal);
    }

    renderAll() {
        try {
            const localData = this.dataManager.getData();
            
            // Check awards before rendering
            this.awardsManager.checkAwards(localData);
            
            // Render greeting
            this.uiManager.renderGreeting(localData, this.firebaseAuth.getAuth());
            
            // Render lists and stats
            this.listRenderer.renderAll();
            
        } catch (error) {
            console.error("Error rendering data:", error);
            this.uiManager.showStatusMessage("Error displaying data.", "error");
        }
    }
}

// Legacy functions for backward compatibility
export function checkUserStatus() {
    // This is now handled by the FirebaseAuth class
    console.log('checkUserStatus is deprecated, using FirebaseAuth class instead');
}

export function renderAll() {
    if (window.hospitalTrackerApp) {
        window.hospitalTrackerApp.renderAll();
    }
}

export function addRecentActivitySection() {
    if (window.hospitalTrackerApp) {
        const dataManager = window.hospitalTrackerApp.dataManager;
        const listRenderer = window.hospitalTrackerApp.listRenderer;
        const recentActivity = dataManager.getRecentActivity();
        listRenderer.renderRecentActivity(recentActivity);
    }
}

export function getUserId() {
    if (window.hospitalTrackerApp) {
        return window.hospitalTrackerApp.firebaseAuth.getUserId();
    }
    return null;
}

export function getRecentActivities() {
    if (window.hospitalTrackerApp) {
        return window.hospitalTrackerApp.dataManager.getRecentActivity();
    }
    return [];
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.hospitalTrackerApp = new HospitalTrackerApp();
    await window.hospitalTrackerApp.initialize();
});
function getRecentActivities() {
    // Logic to retrieve recent activities from local data or API
    return JSON.parse(localStorage.getItem('recentActivities')) || [];
}