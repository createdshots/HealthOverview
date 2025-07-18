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
        console.log('🚀 Creating HospitalTrackerApp instance...');
        
        try {
            this.firebaseAuth = new FirebaseAuth();
            console.log('✅ FirebaseAuth created');
            
            this.dataManager = new DataManager();
            console.log('✅ DataManager created');
            
            this.uiManager = new UIManager();
            console.log('✅ UIManager created');
            
            this.modalManager = new ModalManager();
            console.log('✅ ModalManager created');
            
            this.listRenderer = new ListRenderer();
            console.log('✅ ListRenderer created');
            
            this.awardsManager = new AwardsManager();
            console.log('✅ AwardsManager created');
            
            this.medicalRecordsManager = new MedicalRecordsManager();
            console.log('✅ MedicalRecordsManager created');
            
        } catch (error) {
            console.error('❌ Error creating app components:', error);
        }
    }

    async initialize() {
        try {
            console.log('🔄 Initializing Hospital Tracker App...');
            
            // Initialize UI components first
            console.log('🔄 Initializing UI Manager...');
            const uiResult = this.uiManager.initialize();
            console.log('✅ UI Manager initialized:', uiResult);
            
            console.log('🔄 Initializing Modal Manager...');
            const modalResult = this.modalManager.initialize();
            console.log('✅ Modal Manager initialized:', modalResult);
            
            // Setup callbacks
            console.log('🔄 Setting up callbacks...');
            this.setupCallbacks();
            console.log('✅ Callbacks set up');
            
            // Initialize Firebase Auth
            console.log('🔄 Initializing Firebase Auth...');
            await this.firebaseAuth.initialize();
            console.log('✅ Firebase Auth initialized');
            
            // Setup UI elements
            console.log('🔄 Setting up UI elements...');
            this.setupEventListeners();
            console.log('✅ Event listeners set up');
            
            console.log('🎉 App initialization complete!');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showErrorScreen('Failed to initialize app. Please refresh the page.');
        }
    }

    setupCallbacks() {
        console.log('🔄 Setting up data manager callbacks...');
        
        // Data manager callbacks
        this.dataManager.onStatus((msg, type) => {
            console.log(`📝 Status: ${msg} (${type})`);
            this.uiManager.showStatusMessage(msg, type);
        });
        
        this.dataManager.onLoading((loading, text) => {
            console.log(`⏳ Loading: ${loading} - ${text}`);
            this.uiManager.setLoading(loading, text);
        });
        
        this.dataManager.setFirebaseAuth(this.firebaseAuth);

        // Component data manager setup
        this.listRenderer.setDataManager(this.dataManager);
        this.medicalRecordsManager.setDataManager(this.dataManager);

        // Auth callbacks
        this.firebaseAuth.onAuthChange(async ({ user }) => {
            console.log('🔐 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
            
            this.uiManager.updateUserDisplay(user, user?.uid);
            this.uiManager.updateProfileButtonVisibility(!!user);
            
            if (user) {
                console.log('👤 User authenticated, loading data...');
                this.uiManager.setLoading(true, 'Loading your data...');
                
                // For anonymous users, initialize with default data immediately
                if (user.isAnonymous) {
                    console.log('👻 Anonymous user detected, initializing with default data');
                    try {
                        await this.dataManager.initializeDefaultData();
                        this.renderAll();
                        this.uiManager.setLoading(false);
                    } catch (error) {
                        console.error('❌ Error initializing default data:', error);
                        this.uiManager.setLoading(false);
                    }
                }
            } else {
                console.log('❌ No user authenticated');
            }
        });

        this.firebaseAuth.onDataChange(async ({ data, exists }) => {
            console.log('📊 Data changed:', exists ? 'Data exists' : 'No data', data);
            
            try {
                if (exists && data) {
                    console.log('✅ Setting user data...');
                    this.dataManager.setData(data);
                } else {
                    console.log('⚠️ No user data found, initializing defaults...');
                    this.uiManager.showStatusMessage('No user data found. Setting up defaults...', 'info');
                    await this.dataManager.initializeDefaultData();
                }
                
                this.renderAll();
                this.uiManager.setLoading(false);
            } catch (error) {
                console.error('❌ Error handling data change:', error);
                this.uiManager.setLoading(false);
            }
        });

        // Awards manager callback
        this.awardsManager.onStatus((msg, type) => this.uiManager.showStatusMessage(msg, type));
        
        console.log('✅ All callbacks set up');
    }

    setupEventListeners() {
        console.log('🔄 Setting up event listeners...');
        
        // Button event listeners
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                console.log('🆘 Help button clicked');
                this.modalManager.showHelpModal();
            });
            console.log('✅ Help button listener added');
        }
        
        const profileBtn = document.getElementById('show-profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                console.log('👤 Profile button clicked');
                window.location.href = '/profile.html';
            });
            console.log('✅ Profile button listener added');
        }
        
        const statsBtn = document.getElementById('show-stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                console.log('📊 Stats button clicked');
                this.modalManager.showStatsModal(this.dataManager.getData());
            });
            console.log('✅ Stats button listener added');
        }
        
        const mapBtn = document.getElementById('show-map-btn');
        if (mapBtn) {
            mapBtn.addEventListener('click', () => {
                console.log('🗺️ Map button clicked');
                this.modalManager.showMapModal(this.dataManager.getData());
            });
            console.log('✅ Map button listener added');
        }
        
        const awardsBtn = document.getElementById('show-awards-btn');
        if (awardsBtn) {
            awardsBtn.addEventListener('click', () => {
                console.log('🏆 Awards button clicked');
                this.showAwardsModal();
            });
            console.log('✅ Awards button listener added');
        }
        
        const addRecordBtn = document.getElementById('add-record-btn');
        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => {
                console.log('📝 Add record button clicked');
                this.showAddRecordModal();
            });
            console.log('✅ Add record button listener added');
        }
        
        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                console.log('🚪 Logout button clicked');
                const success = await this.firebaseAuth.logout();
                if (success) {
                    window.location.href = '/';
                } else {
                    this.uiManager.showStatusMessage('Failed to logout. Please try again.', 'error');
                }
            });
            console.log('✅ Logout button listener added');
        }
        
        // List event listeners
        this.setupListEventListeners();
        
        console.log('✅ All event listeners set up');
    }

    setupListEventListeners() {
        console.log('🔄 Setting up list event listeners...');
        
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
                    
                    console.log(`🏥 Hospital interaction: ${type} ${index} ${action}`);
                    
                    if (type && !isNaN(index) && action) {
                        this.dataManager.handleInteraction(type, index, action);
                        this.renderAll();
                    }
                }
            });
            console.log('✅ Hospitals list listener added');
        }

        if (ambulanceList) {
            ambulanceList.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-action]');
                const checkbox = e.target.closest('input[type="checkbox"]');
                
                if (button || checkbox) {
                    const type = button?.dataset.type || checkbox?.dataset.type;
                    const index = parseInt(button?.dataset.index || checkbox?.dataset.index);
                    const action = button?.dataset.action || (checkbox ? 'toggle' : null);
                    
                    console.log(`🚑 Ambulance interaction: ${type} ${index} ${action}`);
                    
                    if (type && !isNaN(index) && action) {
                        this.dataManager.handleInteraction(type, index, action);
                        this.renderAll();
                    }
                }
            });
            console.log('✅ Ambulance list listener added');
        }

        // Search functionality
        const hospitalSearch = document.getElementById('hospital-search');
        const ambulanceSearch = document.getElementById('ambulance-search');

        if (hospitalSearch) {
            hospitalSearch.addEventListener('input', (e) => {
                console.log(`🔍 Hospital search: ${e.target.value}`);
                this.listRenderer.renderList('hospitals', this.dataManager.getData().hospitals, e.target.value);
            });
            console.log('✅ Hospital search listener added');
        }

        if (ambulanceSearch) {
            ambulanceSearch.addEventListener('input', (e) => {
                console.log(`🔍 Ambulance search: ${e.target.value}`);
                this.listRenderer.renderList('ambulance', this.dataManager.getData().ambulance, e.target.value);
            });
            console.log('✅ Ambulance search listener added');
        }
        
        console.log('✅ List event listeners set up');
    }

    showAwardsModal() {
        console.log('🏆 Creating awards modal...');
        const awardsContent = this.awardsManager.generateAwardsModal(this.dataManager.getData());
        const modal = this.modalManager.createModal('awards-modal', 'Your Awards', awardsContent);
        this.modalManager.openModal(modal);
    }

    showAddRecordModal() {
        console.log('📝 Creating add record modal...');
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
    }

    renderAll() {
        try {
            console.log('🎨 Starting render...');
            const data = this.dataManager.getData();
            console.log('📊 Data for rendering:', data);
            
            // Check for new awards
            this.awardsManager.checkAwards(data);
            
            // Render greeting
            this.uiManager.renderGreeting(data, this.firebaseAuth.getAuth());
            
            // Render all lists and stats
            this.listRenderer.renderAll();
            
            console.log('✅ Render complete');
        } catch (error) {
            console.error('❌ Error during render:', error);
        }
    }

    showErrorScreen(message) {
        document.body.innerHTML = `
            <div class="flex items-center justify-center min-h-screen">
                <div class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded text-center max-w-md">
                    <strong>Error:</strong><br>
                    ${message}
                    <br><br>
                    <button onclick="window.location.reload()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, initializing app...');
    
    try {
        const app = new HospitalTrackerApp();
        app.initialize();
    } catch (error) {
        console.error('❌ Failed to create app:', error);
        
        document.body.innerHTML = `
            <div class="flex items-center justify-center min-h-screen">
                <div class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded text-center max-w-md">
                    <strong>Critical Error:</strong><br>
                    Failed to create application instance.
                    <br><br>
                    <button onclick="window.location.reload()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
});