// UI Utilities and Helpers
export class UIManager {
    constructor() {
        this.statusMessageArea = null;
        this.loadingIndicator = null;
        this.loaderText = null;
    }

    initialize() {
        console.log('🔄 UIManager initializing...');
        
        this.statusMessageArea = document.getElementById('status-message-area');
        this.loadingIndicator = document.getElementById('full-page-loader');
        this.loaderText = document.getElementById('loader-text');
        
        const result = {
            statusArea: !!this.statusMessageArea,
            loader: !!this.loadingIndicator,
            loaderText: !!this.loaderText
        };
        
        console.log('✅ UIManager elements found:', result);
        return result;
    }

    showStatusMessage(message, type = 'success') {
        console.log(`📝 Status message: ${message} (${type})`);
        
        if (!this.statusMessageArea) {
            console.warn('⚠️ Status message area not found');
            return;
        }

        const colorClass = type === 'error' ? 'text-red-600' : 
                          type === 'warning' ? 'text-yellow-600' : 
                          type === 'info' ? 'text-blue-600' : 'text-green-600';

        this.statusMessageArea.innerHTML = `
            <div class="${colorClass} text-center font-medium">
                ${message}
            </div>
        `;

        // Clear message after 5 seconds
        setTimeout(() => {
            if (this.statusMessageArea) {
                this.statusMessageArea.innerHTML = '';
            }
        }, 5000);
    }

    setLoading(loading, text = 'Loading...') {
        console.log(`⏳ Loading state: ${loading} - ${text}`);
        
        if (!this.loadingIndicator) {
            console.warn('⚠️ Loading indicator not found');
            return;
        }

        if (loading) {
            this.loadingIndicator.classList.remove('loader-hidden');
            if (this.loaderText) {
                this.loaderText.textContent = text;
            }
        } else {
            this.loadingIndicator.classList.add('loader-hidden');
        }
    }

    updateUserDisplay(user, userId) {
        console.log('👤 Updating user display:', user ? userId : 'No user');
        
        const signedOutView = document.getElementById('auth-signed-out-view');
        const signedInView = document.getElementById('auth-signed-in-view');
        const userIdDisplay = document.getElementById('user-id-display');

        if (user) {
            if (signedOutView) signedOutView.classList.add('hidden');
            if (signedInView) signedInView.classList.remove('hidden');
            if (userIdDisplay) {
                userIdDisplay.textContent = user.isAnonymous ? 'Guest User' : 
                                           (user.displayName || user.email || userId);
            }
        } else {
            if (signedOutView) signedOutView.classList.remove('hidden');
            if (signedInView) signedInView.classList.add('hidden');
        }
    }

    updateProfileButtonVisibility(visible) {
        console.log(`👤 Profile button visibility: ${visible}`);
        
        const profileBtn = document.getElementById('show-profile-btn');
        if (profileBtn) {
            if (visible) {
                profileBtn.classList.remove('hidden');
            } else {
                profileBtn.classList.add('hidden');
            }
        }
    }

    setupBuildTracker() {
        console.log('🔧 Build tracker setup (placeholder)');
    }

    renderGreeting(data, auth) {
        console.log('👋 Rendering greeting...');
        
        const greetingElement = document.getElementById('personal-greeting');
        if (!greetingElement) {
            console.warn('⚠️ Greeting element not found');
            return;
        }

        const user = auth?.currentUser;
        const userName = user?.isAnonymous ? 'Guest' : 
                        (user?.displayName || user?.email?.split('@')[0] || 'User');
        
        const hospitalCount = data?.hospitals?.filter(h => h.visited).length || 0;
        const ambulanceCount = data?.ambulance?.filter(a => a.visited).length || 0;
        
        greetingElement.innerHTML = `
            Welcome back, ${userName}! 
            You've visited ${hospitalCount} hospitals and ${ambulanceCount} ambulance services.
        `;
    }
}
