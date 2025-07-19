/**
 * Displays a status message at the top of the screen.
 * This is a standalone function that can be imported anywhere.
 * @param {string} message The message to display.
 * @param {'success'|'error'|'info'} type The type of message.
 */
export function showStatusMessage(message, type = 'info') {
    // Remove any existing status message
    const existingMessage = document.getElementById('status-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.id = 'status-message';
    messageDiv.textContent = message;

    // Base styles
    messageDiv.className = 'fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 transition-all duration-300 transform opacity-0 -translate-y-full';

    // Type-specific styles
    switch (type) {
        case 'success':
            messageDiv.classList.add('bg-green-600');
            break;
        case 'error':
            messageDiv.classList.add('bg-red-600');
            break;
        default:
            messageDiv.classList.add('bg-blue-600');
            break;
    }

    document.body.appendChild(messageDiv);

    // Animate in
    setTimeout(() => {
        messageDiv.classList.remove('opacity-0', '-translate-y-full');
        messageDiv.classList.add('opacity-100', 'translate-y-0');
    }, 100);

    // Automatically hide after 5 seconds
    setTimeout(() => {
        messageDiv.classList.remove('opacity-100', 'translate-y-0');
        messageDiv.classList.add('opacity-0', '-translate-y-full');
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
}


// UI Manager Class for more complex pages like the dashboard
export class UIManager {
    constructor() {
        this.statusMessageArea = null;
        this.loadingIndicator = null;
        this.authSignedOutView = null;
        this.authSignedInView = null;
    }

    initialize() {
        this.statusMessageArea = document.getElementById('status-message-area');
        this.loadingIndicator = document.getElementById('full-page-loader');
        this.authSignedOutView = document.getElementById('auth-signed-out-view');
        this.authSignedInView = document.getElementById('auth-signed-in-view');
        
        console.log('UI Manager initialized');
        return { 
            statusArea: !!this.statusMessageArea, 
            loader: !!this.loadingIndicator,
            authOut: !!this.authSignedOutView,
            authIn: !!this.authSignedInView
        };
    }

    // The class can also use the standalone function for consistency
    showStatusMessage(message, type = 'info') {
        showStatusMessage(message, type);
    }

    getStatusClasses(type) {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800 border border-green-200';
            case 'error': return 'bg-red-100 text-red-800 border border-red-200';
            case 'info': return 'bg-blue-100 text-blue-800 border border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    }

    setLoading(loading, text = 'Loading...') {
        console.log(`Loading: ${loading} - ${text}`);
        
        if (this.loadingIndicator) {
            const loaderText = document.getElementById('loader-text');
            if (loaderText) {
                loaderText.textContent = text;
            }
            
            if (loading) {
                this.loadingIndicator.classList.remove('loader-hidden');
            } else {
                this.loadingIndicator.classList.add('loader-hidden');
            }
        }
    }

    updateUserDisplay(user, userId) {
        console.log('Updating user display:', user ? 'signed in' : 'signed out');
        
        if (user) {
            // Hide sign-in buttons
            if (this.authSignedOutView) {
                this.authSignedOutView.style.display = 'none';
            }
            
            // Show signed-in state
            if (this.authSignedInView) {
                this.authSignedInView.style.display = 'flex';
                this.authSignedInView.classList.remove('hidden');
            }
            
            // Update user display
            const userIdDisplay = document.getElementById('user-id-display');
            if (userIdDisplay) {
                const displayName = user.isAnonymous ? 'Guest User' : 
                                 (user.displayName || user.email || 'User');
                userIdDisplay.textContent = displayName;
            }
            
        } else {
            // Show sign-in buttons
            if (this.authSignedOutView) {
                this.authSignedOutView.style.display = 'flex';
            }
            
            // Hide signed-in state
            if (this.authSignedInView) {
                this.authSignedInView.style.display = 'none';
                this.authSignedInView.classList.add('hidden');
            }
        }
    }

    updateProfileButtonVisibility(visible) {
        console.log(`Profile button visibility: ${visible}`);
        
        const profileBtn = document.getElementById('show-profile-btn');
        const addRecordBtn = document.getElementById('add-record-btn');
        
        if (profileBtn) {
            if (visible) {
                profileBtn.classList.remove('hidden');
            } else {
                profileBtn.classList.add('hidden');
            }
        }
        
        if (addRecordBtn) {
            if (visible) {
                addRecordBtn.classList.remove('hidden');
            } else {
                addRecordBtn.classList.add('hidden');
            }
        }
    }

    setupBuildTracker() {
        console.log('Build tracker setup');
        // You can add build tracking logic here if needed
    }

    renderGreeting(data, auth) {
        const greetingElement = document.getElementById('personal-greeting');
        if (!greetingElement) return;
        
        const user = auth?.currentUser;
        const displayName = user?.isAnonymous ? 'Guest' : 
                           (user?.displayName || 'User');
        
        const totalHospitals = data?.hospitals?.length || 0;
        const visitedHospitals = data?.hospitals?.filter(h => h.visited)?.length || 0;
        const totalAmbulance = data?.ambulance?.length || 0;
        const visitedAmbulance = data?.ambulance?.filter(a => a.visited)?.length || 0;
        
        greetingElement.innerHTML = `
            Welcome back, ${displayName}! 
            You've visited ${visitedHospitals}/${totalHospitals} hospitals 
            and ${visitedAmbulance}/${totalAmbulance} ambulance services.
        `;
        
        console.log('Greeting rendered for', displayName);
    }

    updateStats(type, data) {
        const statsElement = document.getElementById(`${type}-stats`);
        if (!statsElement) return;
        
        const total = data.length;
        const visited = data.filter(item => item.visited).length;
        const percentage = total > 0 ? Math.round((visited / total) * 100) : 0;
        
        statsElement.innerHTML = `
            <div class="text-sm text-gray-600">
                Progress: ${visited}/${total} (${percentage}%)
                <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                         style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }
}
