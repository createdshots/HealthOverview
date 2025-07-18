import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

export class FirebaseAuth {
    constructor() {
        this.app = null;
        this.auth = null;
        this.userId = null;
        this.currentUser = null;
        this.onAuthChangeCallback = null;
        this.onDataChangeCallback = null;
        this.userToken = null;
    }

    async initialize() {
        if (typeof window.userFirebaseConfig === 'undefined') {
            throw new Error('Firebase configuration not found');
        }
        this.app = initializeApp(window.userFirebaseConfig);
        this.auth = getAuth(this.app);
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            
            if (user) {
                this.userId = user.uid;
                
                try {
                    // Get Firebase ID token for API calls
                    this.userToken = await user.getIdToken();
                    
                    // Check if user needs onboarding (only for non-anonymous Google users)
                    if (!user.isAnonymous && user.providerData[0]?.providerId === 'google.com') {
                        const userData = await this.fetchUserData();
                        if (!userData || Object.keys(userData).length === 0) {
                            console.log('New user detected, redirecting to profile setup');
                            window.location.href = '/profile.html?onboarding=1';
                            return;
                        }
                    }

                    if (this.onAuthChangeCallback) {
                        this.onAuthChangeCallback({ user });
                    }
                    
                    // Load user data for non-anonymous users
                    if (!user.isAnonymous) {
                        await this.loadUserData();
                    } else {
                        // For anonymous users, provide empty data
                        if (this.onDataChangeCallback) {
                            this.onDataChangeCallback({ data: null, exists: false });
                        }
                    }
                } catch (error) {
                    console.error('Error in auth setup:', error);
                }
            } else {
                this.userId = null;
                this.userToken = null;
                this.currentUser = null;
                
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath === '/' || currentPath.includes('index.html');
                
                if (!isOnLoginPage && !currentPath.includes('profile.html')) {
                    console.log('User not authenticated, redirecting to login');
                    window.location.href = '/';
                } else {
                    if (this.onAuthChangeCallback) {
                        this.onAuthChangeCallback({ user: null });
                    }
                }
            }
        }, (error) => {
            console.error('Auth state change error:', error);
        });
    }

    async fetchUserData() {
        if (!this.userId || !this.userToken) {
            console.warn('Cannot fetch data: no user ID or token');
            return null;
        }

        try {
            const response = await fetch(`/api/auth/users/${this.userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return null; // User doesn't exist yet
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    async loadUserData() {
        try {
            const userData = await this.fetchUserData();
            if (this.onDataChangeCallback) {
                this.onDataChangeCallback({ 
                    data: userData, 
                    exists: userData !== null 
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            if (this.onDataChangeCallback) {
                this.onDataChangeCallback({ data: null, exists: false });
            }
        }
    }

    async saveData(data) {
        if (!this.userId || !this.userToken) {
            console.warn('Cannot save data: no user ID or token (anonymous user)');
            return false;
        }
        
        try {
            const response = await fetch(`/api/auth/users/${this.userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Data saved successfully');
            return result.success;
        } catch (error) {
            console.error("Error saving data:", error);
            return false;
        }
    }

    async refreshToken() {
        if (this.currentUser) {
            try {
                this.userToken = await this.currentUser.getIdToken(true);
                return this.userToken;
            } catch (error) {
                console.error('Error refreshing token:', error);
                return null;
            }
        }
        return null;
    }

    // API helper method for making authenticated requests
    async apiCall(endpoint, options = {}) {
        if (!this.userToken) {
            await this.refreshToken();
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.userToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(endpoint, { ...defaultOptions, ...options });
            
            // If token expired, refresh and retry once
            if (response.status === 401) {
                await this.refreshToken();
                defaultOptions.headers['Authorization'] = `Bearer ${this.userToken}`;
                return fetch(endpoint, { ...defaultOptions, ...options });
            }
            
            return response;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    onAuthChange(callback) { this.onAuthChangeCallback = callback; }
    onDataChange(callback) { this.onDataChangeCallback = callback; }
    getAuth() { return this.auth; }
    getUserId() { return this.userId; }
    getCurrentUser() { return this.currentUser; }
    getToken() { return this.userToken; }
    
    async logout() {
        try {
            await signOut(this.auth);
            console.log('User signed out successfully');
            return true;
        } catch (error) {
            console.error("Logout error:", error);
            return false;
        }
    }
}