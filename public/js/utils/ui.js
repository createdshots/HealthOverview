// UI Utilities and Helpers
export class UIManager {
    constructor() {
        this.statusMessageArea = null;
        this.loadingIndicator = null;
        this.loaderText = null;
    }

    initialize() {
        this.statusMessageArea = document.getElementById('status-message-area');
        this.loadingIndicator = document.getElementById('full-page-loader');
        this.loaderText = document.getElementById('loader-text');
        
        return {
            statusArea: !!this.statusMessageArea,
            loader: !!this.loadingIndicator
        };
    }

    showStatusMessage(message, type = 'success') {
        if (!this.statusMessageArea) return;
        
        this.statusMessageArea.textContent = message;
        this.statusMessageArea.className = `status-message mt-4 h-6 font-medium ${type === 'error' ? 'text-red-600' : 'text-green-600'}`;
        this.statusMessageArea.style.opacity = 1;
        
        setTimeout(() => { 
            this.statusMessageArea.style.opacity = 0; 
        }, 5000);
    }

    setLoading(isLoading, text = 'Loading...') {
        if (!this.loadingIndicator) return;
        
        if (isLoading) {
            this.loadingIndicator.classList.remove('loader-hidden');
            if (this.loaderText && text) {
                this.loaderText.textContent = text;
            }
        } else {
            this.loadingIndicator.classList.add('loader-hidden');
        }
    }

    updateUserDisplay(user, userId) {
        const userIdDisplay = document.getElementById('user-id-display');
        const authSignedInView = document.getElementById('auth-signed-in-view');
        const authSignedOutView = document.getElementById('auth-signed-out-view');

        if (userIdDisplay && user) {
            userIdDisplay.textContent = user.isAnonymous ? 'Guest' : user.displayName || user.email;
        }

        if (authSignedInView && authSignedOutView) {
            if (userId) {
                authSignedInView.style.display = 'flex';
                authSignedOutView.style.display = 'none';
            } else {
                authSignedInView.style.display = 'none';
                authSignedOutView.style.display = 'flex';
            }
        }

        this.updateProfileButtonVisibility(!!userId);
    }

    updateProfileButtonVisibility(hasUserId) {
        const profileBtn = document.getElementById('show-profile-btn');
        const addRecordBtn = document.getElementById('add-record-btn');

        if (profileBtn) {
            if (hasUserId) {
                profileBtn.classList.remove('hidden');
            } else {
                profileBtn.classList.add('hidden');
            }
        }

        if (addRecordBtn) {
            if (hasUserId) {
                addRecordBtn.classList.remove('hidden');
            } else {
                addRecordBtn.classList.add('hidden');
            }
        }
    }

    renderGreeting(localData, auth) {
        let name = localData.userProfile?.displayName?.trim();
        if (!name) {
            const user = auth?.currentUser;
            name = user?.displayName || user?.email || (user?.isAnonymous ? 'Guest' : 'User');
        }
        
        const greetingDiv = document.getElementById('personal-greeting');
        if (greetingDiv) {
            greetingDiv.textContent = `Hello, ${name}!`;
        }
    }

    setupBuildTracker() {
        // Remove old badges if present
        const oldBuild = document.getElementById('build-tracker');
        if (oldBuild) oldBuild.remove();
        const oldWip = document.getElementById('wip-badge');
        if (oldWip) oldWip.remove();
        
        // Create a container for badges in the bottom left
        let badgeContainer = document.getElementById('badge-container');
        if (!badgeContainer) {
            badgeContainer = document.createElement('div');
            badgeContainer.id = 'badge-container';
            badgeContainer.style.position = 'fixed';
            badgeContainer.style.bottom = '1.5rem';
            badgeContainer.style.left = '1.5rem';
            badgeContainer.style.display = 'flex';
            badgeContainer.style.flexDirection = 'row';
            badgeContainer.style.alignItems = 'center';
            badgeContainer.style.gap = '12px';
            badgeContainer.style.zIndex = '9998';
            badgeContainer.style.pointerEvents = 'none';
            document.body.appendChild(badgeContainer);
        }
        
        // Build tracker badge (dynamic)
        const buildDiv = document.createElement('div');
        buildDiv.id = 'build-tracker';
        buildDiv.style.background = '#fff';
        buildDiv.style.color = '#6366f1';
        buildDiv.style.fontWeight = '500';
        buildDiv.style.fontSize = '1rem';
        buildDiv.style.padding = '4px 14px';
        buildDiv.style.borderRadius = '10px';
        buildDiv.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
        buildDiv.style.opacity = '0.92';
        buildDiv.style.pointerEvents = 'auto';
        buildDiv.style.cursor = 'pointer';
        
        // Default fallback version
        let fallbackVersion = 'v0.9.0';
        buildDiv.textContent = `Build: ${fallbackVersion}`;
        badgeContainer.appendChild(buildDiv);

        // Fetch latest commit hash from GitHub API
        fetch('https://api.github.com/repos/createdshots/ambulance-hospitaltracker/commits/main')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.sha) {
                    const shortSha = data.sha.substring(0, 7);
                    buildDiv.innerHTML = `<a href="https://github.com/createdshots/ambulance-hospitaltracker/commit/${data.sha}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;pointer-events:auto;">Build: <span style='font-family:monospace;'>${shortSha}</span></a>`;
                }
            })
            .catch(() => {
                // fallback, already set
            });

        // Work-in-progress badge
        const wipBadge = document.createElement('div');
        wipBadge.id = 'wip-badge';
        wipBadge.innerHTML = `<span style="font-size:1.1em;vertical-align:middle;">🚧</span> <span style="vertical-align:middle;">Work in Progress</span>`;
        wipBadge.style.background = '#fff';
        wipBadge.style.color = '#b45309';
        wipBadge.style.fontWeight = '500';
        wipBadge.style.fontSize = '1rem';
        wipBadge.style.padding = '4px 14px';
        wipBadge.style.borderRadius = '10px';
        wipBadge.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
        wipBadge.style.opacity = '0.92';
        wipBadge.style.pointerEvents = 'none';
        badgeContainer.appendChild(wipBadge);
    }

    getFormData(form, conditionPrefix = 'condition_') {
        const data = {};
        const formData = new FormData(form);
        
        for (let [key, value] of formData.entries()) {
            if (key.startsWith(conditionPrefix)) {
                const parts = key.split('_');
                const condition = parts[1];
                const field = parts.slice(2).join('_');
                
                if (!data[condition]) {
                    data[condition] = {};
                }
                
                const inputElement = form.querySelector(`[name="${key}"]`);
                if (inputElement && inputElement.type === 'checkbox') {
                    data[condition][field] = inputElement.checked;
                } else if (value) {
                    data[condition][field] = value;
                }
            }
        }
        
        return data;
    }
}
