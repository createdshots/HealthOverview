// Move your main app logic here from src/app.js
import { FirebaseAuth } from './auth.js';
import { DataManager } from './data/dataManager.js';
import { UIManager } from './utils/ui.js';
import { ModalManager } from './components/modal.js';
import { ListRenderer } from './components/list.js';
import { AwardsManager } from './features/awards.js';
import { MedicalRecordsManager } from './features/medicalRecords.js';

class HospitalTrackerApp {
    constructor() {
        this.firebaseAuth = new FirebaseAuth();
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        this.modalManager = new ModalManager();
        this.listRenderer = new ListRenderer();
        this.awardsManager = new AwardsManager();
        this.medicalRecordsManager = new MedicalRecordsManager();
    }

    async initialize() {
        try {
            console.log('Initializing Hospital Tracker App...');
            
            // Initialize UI components
            this.uiManager.initialize();
            this.modalManager.initialize();
            
            // Setup callbacks
            this.setupCallbacks();
            
            // Initialize Firebase Auth
            await this.firebaseAuth.initialize();
            
            // Setup UI elements
            this.uiManager.setupBuildTracker();
            this.setupEventListeners();
            
            console.log('App initialization complete');
        } catch (error) {
            console.error('App initialization failed:', error);
            this.uiManager.showStatusMessage('Failed to initialize app. Please refresh the page.', 'error');
        }
    }

    setupCallbacks() {
        // Data manager callbacks
        this.dataManager.onStatus((msg, type) => this.uiManager.showStatusMessage(msg, type));
        this.dataManager.onLoading((loading, text) => this.uiManager.setLoading(loading, text));
        this.dataManager.setFirebaseAuth(this.firebaseAuth);

        // Component data manager setup
        this.listRenderer.setDataManager(this.dataManager);
        this.medicalRecordsManager.setDataManager(this.dataManager);

        // Auth callbacks
        this.firebaseAuth.onAuthChange(async ({ user }) => {
            console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
            this.uiManager.updateUserDisplay(user, user?.uid);
            this.uiManager.updateProfileButtonVisibility(!!user);
            
            if (user) {
                this.uiManager.setLoading(true, 'Loading your data...');
                // For anonymous users, initialize with default data immediately
                if (user.isAnonymous) {
                    console.log('Anonymous user detected, initializing with default data');
                    await this.dataManager.initializeDefaultData();
                    this.renderAll();
                    this.uiManager.setLoading(false);
                }
            }
        });

        this.firebaseAuth.onDataChange(async ({ data, exists }) => {
            console.log('Data changed:', exists ? 'Data exists' : 'No data');
            
            if (exists && data) {
                this.dataManager.setData(data);
            } else {
                this.uiManager.showStatusMessage('No user data found. Setting up defaults...', 'info');
                await this.dataManager.initializeDefaultData();
            }
            
            this.renderAll();
            this.uiManager.setLoading(false);
        });

        // Awards manager callback
        this.awardsManager.onStatus((msg, type) => this.uiManager.showStatusMessage(msg, type));
    }

    setupEventListeners() {
        // Button event listeners
        document.getElementById('help-btn')?.addEventListener('click', () => {
            this.modalManager.showHelpModal();
        });
        
        document.getElementById('show-profile-btn')?.addEventListener('click', () => {
            window.location.href = '/profile.html';
        });
        
        document.getElementById('show-stats-btn')?.addEventListener('click', () => {
            this.modalManager.showStatsModal(this.dataManager.getData());
        });
        
        document.getElementById('show-map-btn')?.addEventListener('click', () => {
            this.modalManager.showMapModal(this.dataManager.getData());
        });
        
        document.getElementById('show-awards-btn')?.addEventListener('click', () => {
            this.showAwardsModal();
        });
        
        document.getElementById('add-record-btn')?.addEventListener('click', () => {
            this.showAddRecordModal();
        });
        
        // Logout functionality
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            const success = await this.firebaseAuth.logout();
            if (success) {
                window.location.href = '/';
            } else {
                this.uiManager.showStatusMessage('Failed to logout. Please try again.', 'error');
            }
        });
        
        // List event listeners
        this.setupListEventListeners();
    }

    setupListEventListeners() {
        const hospitalsList = document.getElementById('hospitals-list');
        const ambulanceList = document.getElementById('ambulance-list');

        if (hospitalsList) {
            hospitalsList.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-action]');
                const checkbox = e.target.closest('input[type="checkbox"]');
                
                if (button || checkbox) {
                    const type = button?.dataset.type || checkbox?.dataset.type;
                    const index = parseInt(button?.dataset.index || checkbox?.dataset.index);
                    const action = button?.dataset.action || (checkbox ? 'toggle' : null);
                    
                    if (type && !isNaN(index) && action) {
                        this.dataManager.handleInteraction(type, index, action);
                        this.renderAll();
                    }
                }
            });
        }

        if (ambulanceList) {
            ambulanceList.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-action]');
                const checkbox = e.target.closest('input[type="checkbox"]');
                
                if (button || checkbox) {
                    const type = button?.dataset.type || checkbox?.dataset.type;
                    const index = parseInt(button?.dataset.index || checkbox?.dataset.index);
                    const action = button?.dataset.action || (checkbox ? 'toggle' : null);
                    
                    if (type && !isNaN(index) && action) {
                        this.dataManager.handleInteraction(type, index, action);
                        this.renderAll();
                    }
                }
            });
        }

        // Search functionality
        const hospitalSearch = document.getElementById('hospital-search');
        const ambulanceSearch = document.getElementById('ambulance-search');

        if (hospitalSearch) {
            hospitalSearch.addEventListener('input', (e) => {
                this.listRenderer.renderList('hospitals', this.dataManager.getData().hospitals, e.target.value);
            });
        }

        if (ambulanceSearch) {
            ambulanceSearch.addEventListener('input', (e) => {
                this.listRenderer.renderList('ambulance', this.dataManager.getData().ambulance, e.target.value);
            });
        }
    }

    showAwardsModal() {
        const awardsContent = this.awardsManager.generateAwardsModal(this.dataManager.getData());
        const modal = this.modalManager.createModal('awards-modal', 'Your Awards', awardsContent);
        this.modalManager.openModal(modal);
    }

    showAddRecordModal() {
        const modalContent = this.medicalRecordsManager.createAddRecordForm();
        const modal = this.modalManager.createModal('add-record-modal', 'Add Medical Record', modalContent, 'max-w-2xl');
        this.modalManager.openModal(modal);
        this.setupAddRecordEventListeners(modal);
    }

    setupAddRecordEventListeners(modal) {
        const form = modal.querySelector('#add-record-form');
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
        }

        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.modalManager.closeModal(modal));
        }
        
        const ambulanceCheckbox = modal.querySelector('#ambulance-involved');
        const ambulanceSection = modal.querySelector('#ambulance-section');
        if (ambulanceCheckbox && ambulanceSection) {
            ambulanceCheckbox.addEventListener('change', (e) => {
                ambulanceSection.classList.toggle('hidden', !e.target.checked);
            });
        }
    }

    renderAll() {
        try {
            const data = this.dataManager.getData();
            
            // Check for new awards
            this.awardsManager.checkAwards(data);
            
            // Render greeting
            this.uiManager.renderGreeting(data, this.firebaseAuth.getAuth());
            
            // Render all lists and stats
            this.listRenderer.renderAll();
            
            console.log('Render complete');
        } catch (error) {
            console.error('Error during render:', error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    const app = new HospitalTrackerApp();
    app.initialize();
});