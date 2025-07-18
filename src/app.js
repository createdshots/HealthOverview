// Main Application Entry Point for Hospital Tracker
import { FirebaseAuth } from './firebase/auth.js';

// Immediate authentication check - prevent access to protected pages
const currentPath = window.location.pathname;
const isLoginPage = currentPath === '/' || currentPath.includes('index.html') || currentPath === '/public/' || currentPath === '/public/index.html';
const isProfilePage = currentPath.includes('profile.html');
const isDashboardPage = currentPath.includes('dashboard.html');

// Only run auth check on protected pages (dashboard, not login or profile)
if (!isLoginPage && !isProfilePage) {
  // Show loading while checking authentication
  document.body.style.visibility = 'hidden';
  
  // Initialize Firebase Auth and check authentication status
  const firebaseAuth = new FirebaseAuth();
  firebaseAuth.initialize().then(() => {
    firebaseAuth.onAuthChange(({ user }) => {
      if (!user) {
        // User not authenticated, redirect to login
        window.location.href = '/';  // Changed from '/login.html' to '/'
      } else {
        // User is authenticated, show the page
        document.body.style.visibility = 'visible';
        // Initialize the app
        initializeApp();
      }
    });
  }).catch((error) => {
    console.error('Firebase initialization failed:', error);
    window.location.href = '/';  // Changed from '/login.html' to '/'
  });
} else {
  // On login/profile pages, initialize normally
  initializeApp();
}

async function initializeApp() {
    // Show loading while checking authentication
    document.body.style.visibility = 'hidden';
    
    try {
        // Initialize Firebase Auth and check authentication status
        const firebaseAuth = new FirebaseAuth();
        await firebaseAuth.initialize();
        
        return new Promise((resolve) => {
            firebaseAuth.onAuthChange(({ user }) => {
                if (!user) {
                    // User not authenticated, redirect to login
                    window.location.href = '/';  // Changed from '/login.html' to '/'
                } else {
                    // User is authenticated, show the page and start app
                    document.body.style.visibility = 'visible';
                    startApp();
                    resolve();
                }
            });
        });
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        window.location.href = '/';  // Changed from '/login.html' to '/'
    }
}
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
        this.uiManager.initialize();
        this.modalManager.initialize();
        this.setupCallbacks();
        await this.firebaseAuth.initialize();
        this.uiManager.setupBuildTracker();
        this.setupEventListeners();
    }

    setupCallbacks() {
        this.dataManager.onStatus((msg, type) => this.uiManager.showStatusMessage(msg, type));
        this.dataManager.onLoading((loading, text) => this.uiManager.setLoading(loading, text));
        this.dataManager.setFirebaseAuth(this.firebaseAuth);

        this.listRenderer.setDataManager(this.dataManager);
        this.medicalRecordsManager.setDataManager(this.dataManager);

        this.firebaseAuth.onAuthChange(async ({ user }) => {
            this.uiManager.updateUserDisplay(user);
            this.uiManager.updateProfileButtonVisibility(!!user);
            if (user) {
                this.uiManager.setLoading(true, 'Connecting to your data...');
            }
        });

        this.firebaseAuth.onDataChange(async ({ data, exists }) => {
            if (exists) {
                this.dataManager.setData(data);
            } else {
                this.uiManager.showStatusMessage('No user data found. Importing defaults...', 'info');
                await this.dataManager.initializeDefaultData();
            }
            this.renderAll();
            this.uiManager.setLoading(false);
        });
    }

    setupEventListeners() {
        document.getElementById('help-btn')?.addEventListener('click', () => this.modalManager.showHelpModal());
        document.getElementById('show-profile-btn')?.addEventListener('click', () => window.location.href = '/profile.html');
        document.getElementById('show-stats-btn')?.addEventListener('click', () => this.modalManager.showStatsModal(this.dataManager.getData()));
        document.getElementById('show-map-btn')?.addEventListener('click', () => this.modalManager.showMapModal(this.dataManager.getData()));
        document.getElementById('show-awards-btn')?.addEventListener('click', () => this.showAwardsModal());
        document.getElementById('add-record-btn')?.addEventListener('click', () => this.showAddRecordModal());
        
        // Logout functionality
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            const success = await this.firebaseAuth.logout();
            if (success) {
                window.location.href = '/';  // Changed from '/login.html' to '/' (goes to index.html)
            } else {
                this.uiManager.showStatusMessage('Failed to logout. Please try again.', 'error');
            }
        });
        
        this.listRenderer.setupEventListeners(() => this.renderAll());
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
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const record = this.medicalRecordsManager.processFormData(form);
            this.dataManager.addMedicalRecord(record);
            await this.dataManager.saveData();
            this.modalManager.closeModal(modal);
            this.uiManager.showStatusMessage('Medical record added successfully!', 'success');
            this.renderAll();
        });

        modal.querySelector('.cancel-btn')?.addEventListener('click', () => this.modalManager.closeModal(modal));
        
        const ambulanceCheckbox = modal.querySelector('#ambulance-involved');
        const ambulanceSection = modal.querySelector('#ambulance-section');
        ambulanceCheckbox?.addEventListener('change', (e) => {
            ambulanceSection.classList.toggle('hidden', !e.target.checked);
        });
    }

    renderAll() {
        const data = this.dataManager.getData();
        const newAwards = this.awardsManager.checkAwards(data);
        if (newAwards.length > 0) {
            newAwards.forEach(award => this.uiManager.showStatusMessage(`Award Unlocked: ${award.name}`, 'success'));
            this.dataManager.saveData();
        }
        this.uiManager.renderGreeting(data, this.firebaseAuth.getAuth());
        this.listRenderer.renderAll();
    }
}

// Initialize app function
function startApp() {
    const app = new HospitalTrackerApp();
    app.initialize();
}

// Check if we're on a protected page and need authentication
if (!isLoginPage && !isProfilePage) {
    // Wait for DOM and then check authentication
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
    });
} else {
    // On login/profile pages, just start normally
    document.addEventListener('DOMContentLoaded', startApp);
}