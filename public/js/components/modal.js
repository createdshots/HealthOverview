// Modal system for creating and managing modals
export class ModalManager {
    constructor() {
        this.modalContainer = document.getElementById('modal-container') || document.body;
    }

    initialize() {
        console.log('Modal manager initialized');
        return true;
    }

    // Create a new modal
    createModal(id, title, content, size = 'max-w-4xl') {
        const modalHTML = `
            <div id="${id}" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 opacity-0 modal-backdrop">
                <div class="bg-white rounded-xl shadow-2xl p-6 w-full ${size} modal-content transform scale-95">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold text-gray-900">${title}</h2>
                        <button class="close-modal-btn text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
                    </div>
                    <div>${content}</div>
                </div>
            </div>`;
        
        this.modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById(id);

        // Handle close button clicks
        modal.querySelector('.close-modal-btn').addEventListener('click', () => this.closeModal(modal));

        // Handle backdrop clicks
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal);
        });

        return modal;
    }

    // Open a modal with animation
    openModal(modal) {
        modal.classList.remove('hidden', 'opacity-0');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.modal-content').classList.remove('scale-95');
        }, 10);
    }

    // Close a modal with animation
    closeModal(modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    // Create and show a simple confirmation modal
    showConfirmation(title, message, onConfirm, onCancel = null) {
        const content = `
            <div class="text-gray-700 mb-6">${message}</div>
            <div class="flex justify-end space-x-3">
                <button class="cancel-btn px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                </button>
                <button class="confirm-btn px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Confirm
                </button>
            </div>
        `;

        const modal = this.createModal('confirmation-modal', title, content, 'max-w-md');
        
        // Handle button clicks
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeModal(modal);
            if (onCancel) onCancel();
        });
        
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            this.closeModal(modal);
            if (onConfirm) onConfirm();
        });

        this.openModal(modal);
        return modal;
    }

    // Create and show an alert modal
    showAlert(title, message, type = 'info') {
        const iconMap = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };

        const colorMap = {
            'success': 'text-green-600',
            'error': 'text-red-600',
            'warning': 'text-yellow-600',
            'info': 'text-blue-600'
        };

        const content = `
            <div class="flex items-center space-x-3 mb-6">
                <span class="text-2xl">${iconMap[type] || iconMap.info}</span>
                <div class="${colorMap[type] || colorMap.info}">${message}</div>
            </div>
            <div class="flex justify-end">
                <button class="ok-btn px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    OK
                </button>
            </div>
        `;

        const modal = this.createModal('alert-modal', title, content, 'max-w-md');
        
        modal.querySelector('.ok-btn').addEventListener('click', () => {
            this.closeModal(modal);
        });

        this.openModal(modal);
        return modal;
    }

    showHelpModal() {
        console.log('Showing help modal');
    }

    showStatsModal(data) {
        console.log('Showing stats modal with data:', data);
    }

    showMapModal(data) {
        console.log('Showing map modal with data:', data);
    }

    // Close all open modals
    closeAllModals() {
        const modals = document.querySelectorAll('.modal-backdrop');
        modals.forEach(modal => this.closeModal(modal));
    }
}

// Create singleton instance
const modalManager = new ModalManager();

// Legacy exports for backward compatibility
export function createModal(id, title, content, size = 'max-w-md') {
    return modalManager.createModal(id, title, content, size);
}

export function openModal(modal) {
    modalManager.openModal(modal);
}

export function closeModal(modal) {
    modalManager.closeModal(modal);
}

export { modalManager };