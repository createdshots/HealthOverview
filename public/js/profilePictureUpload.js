// Profile Picture Upload Module
import { 
    auth, 
    db, 
    doc, 
    getDoc, 
    setDoc, 
    uploadToCloudinary, 
    deleteFromCloudinary 
} from '/firebaseConfig.js';

class ProfilePictureUploader {
    constructor() {
        this.cropper = null;
        this.currentFile = null;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.init();
    }

    init() {
        console.log('🔧 Initializing ProfilePictureUploader...');
        // Target the main profile picture container instead of header
        const profilePicContainer = document.getElementById('main-profile-pic-container');
        const fileInput = document.getElementById('profile-pic-input');

        console.log('🎯 Profile pic container:', profilePicContainer);
        console.log('📁 File input:', fileInput);

        if (profilePicContainer) {
            console.log('✅ Adding click listener to profile container');
            profilePicContainer.addEventListener('click', () => {
                console.log('🖱️ Profile picture clicked!');
                this.openFileDialog();
            });
        } else {
            console.log('❌ Profile picture container not found');
        }

        if (fileInput) {
            console.log('✅ Adding change listener to file input');
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        } else {
            console.log('❌ File input not found');
        }
    }

    openFileDialog() {
        const fileInput = document.getElementById('profile-pic-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileSelect(event) {
        console.log('🖼️ File selected for upload');
        const file = event.target.files[0];
        if (!file) {
            console.log('❌ No file selected');
            return;
        }

        console.log('📁 Selected file:', file.name, file.size, file.type);

        // Validate file
        if (!this.validateFile(file)) {
            console.log('❌ File validation failed');
            return;
        }

        console.log('✅ File validation passed');
        this.currentFile = file;
        this.showCropModal(file);
    }

    validateFile(file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return false;
        }

        // Check file size (5MB limit)
        if (file.size > this.maxFileSize) {
            this.showError('Image must be smaller than 5MB');
            return false;
        }

        return true;
    }

    showCropModal(file) {
        const modalHtml = `
            <div id="crop-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">Crop Profile Picture</h3>
                        <button id="close-crop-modal" class="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                    </div>
                    
                    <div class="mb-6">
                        <img id="crop-image" class="max-w-full" style="max-height: 400px;">
                    </div>
                    
                    <div class="flex justify-between">
                        <button id="cancel-crop" class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button id="save-crop" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <span id="save-crop-text">Save Picture</span>
                            <div id="save-crop-loading" class="hidden flex items-center">
                                <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Uploading...
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Initialize cropper
        const cropImage = document.getElementById('crop-image');
        const reader = new FileReader();
        
        reader.onload = (e) => {
            cropImage.src = e.target.result;
            
            // Initialize Cropper.js
            this.cropper = new Cropper(cropImage, {
                aspectRatio: 1, // Square crop
                viewMode: 1,
                responsive: true,
                background: false,
                autoCropArea: 0.8,
                cropBoxResizable: true,
                cropBoxMovable: true,
                guides: false,
                center: true,
                highlight: false,
                ready: () => {
                    console.log('Cropper ready');
                }
            });
        };
        
        reader.readAsDataURL(file);

        // Event listeners
        document.getElementById('close-crop-modal').addEventListener('click', () => this.closeCropModal());
        document.getElementById('cancel-crop').addEventListener('click', () => this.closeCropModal());
        document.getElementById('save-crop').addEventListener('click', () => this.saveCroppedImage());
    }

    closeCropModal() {
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
        
        const modal = document.getElementById('crop-modal');
        if (modal) {
            modal.remove();
        }

        // Clear file input
        const fileInput = document.getElementById('profile-pic-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    async saveCroppedImage() {
        console.log('💾 Starting save process...');
        if (!this.cropper || !auth.currentUser) {
            console.log('❌ Missing cropper or user auth');
            this.showError('Unable to save image');
            return;
        }

        const saveButton = document.getElementById('save-crop');
        const saveText = document.getElementById('save-crop-text');
        const saveLoading = document.getElementById('save-crop-loading');
        
        // Show loading state
        saveButton.disabled = true;
        saveText.classList.add('hidden');
        saveLoading.classList.remove('hidden');

        try {
            console.log('🖼️ Getting cropped canvas...');
            // Get cropped canvas
            const canvas = this.cropper.getCroppedCanvas({
                width: 400,
                height: 400,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            console.log('📦 Converting to blob...');
            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            
            // Create file from blob
            const croppedFile = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' });
            console.log('📁 Created cropped file:', croppedFile.size, 'bytes');

            console.log('☁️ Uploading to Cloudinary...');
            // Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(croppedFile);
            console.log('✅ Upload result:', uploadResult);

            console.log('💾 Updating user profile...');
            // Update user profile in Firestore
            await this.updateUserProfile(uploadResult.url, uploadResult.publicId);

            console.log('🔄 Updating UI...');
            // Update UI
            this.updateProfilePicture(uploadResult.url);

            this.showSuccess('Profile picture updated successfully!');
            this.closeCropModal();

        } catch (error) {
            console.error('💥 Error saving profile picture:', error);
            this.showError('Failed to save profile picture. Please try again.');
            
            // Reset button state
            saveButton.disabled = false;
            saveText.classList.remove('hidden');
            saveLoading.classList.add('hidden');
        }
    }

    async updateUserProfile(imageUrl, publicId) {
        const user = auth.currentUser;
        if (!user) throw new Error('No authenticated user');

        const userDocRef = doc(db, 'users', user.uid);
        
        // Get current user data
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Delete old profile picture if it exists
        if (userData.profilePicture && userData.profilePicture.publicId) {
            try {
                await deleteFromCloudinary(userData.profilePicture.publicId);
            } catch (error) {
                console.warn('Failed to delete old profile picture:', error);
            }
        }

        // Update with new profile picture
        await setDoc(userDocRef, {
            ...userData,
            profilePicture: {
                url: imageUrl,
                publicId: publicId,
                updatedAt: new Date().toISOString()
            }
        }, { merge: true });
    }

    updateProfilePicture(imageUrl) {
        // Update main profile picture on profile page
        const mainProfilePic = document.getElementById('main-profile-pic');
        const mainAvatar = document.getElementById('main-avatar');
        
        if (mainProfilePic && mainAvatar) {
            mainProfilePic.src = imageUrl;
            mainProfilePic.classList.remove('hidden');
            mainAvatar.classList.add('hidden');
        }

        // Also update header profile picture for consistency (if it exists)
        const headerProfilePic = document.getElementById('user-profile-pic');
        const headerAvatar = document.getElementById('user-avatar');
        
        if (headerProfilePic && headerAvatar) {
            headerProfilePic.src = imageUrl;
            headerProfilePic.classList.remove('hidden');
            headerAvatar.classList.add('hidden');
        }

        // Update dashboard profile picture (if exists - when user navigates there)
        const dashboardProfilePic = document.querySelector('#user-profile-pic');
        if (dashboardProfilePic) {
            dashboardProfilePic.src = imageUrl;
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageArea = document.getElementById('status-message-area');
        if (!messageArea) return;

        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const messageId = `message-${Date.now()}`;
        
        const messageHtml = `
            <div id="${messageId}" class="${bgColor} text-white px-6 py-3 rounded-lg shadow-lg mb-2 transform transition-all duration-300 translate-x-full">
                <div class="flex items-center justify-between">
                    <span>${message}</span>
                    <button onclick="document.getElementById('${messageId}').remove()" class="ml-4 text-white hover:text-gray-200">
                        ×
                    </button>
                </div>
            </div>
        `;
        
        messageArea.insertAdjacentHTML('beforeend', messageHtml);
        
        // Animate in
        setTimeout(() => {
            const messageEl = document.getElementById(messageId);
            if (messageEl) {
                messageEl.classList.remove('translate-x-full');
            }
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const messageEl = document.getElementById(messageId);
            if (messageEl) {
                messageEl.classList.add('translate-x-full');
                setTimeout(() => messageEl.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded, but check for main profile container periodically
document.addEventListener('DOMContentLoaded', () => {
    // Check if main profile container exists, if not wait for it
    function initializeUploader() {
        const mainContainer = document.getElementById('main-profile-pic-container');
        if (mainContainer) {
            new ProfilePictureUploader();
        } else {
            // Wait and try again (profile content might still be loading)
            setTimeout(initializeUploader, 500);
        }
    }
    
    initializeUploader();
});

// Make ProfilePictureUploader available globally
window.ProfilePictureUploader = ProfilePictureUploader;

export default ProfilePictureUploader;
