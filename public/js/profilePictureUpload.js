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
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('⚠️ ProfilePictureUploader already initialized');
            return;
        }

        console.log('🔧 Initializing ProfilePictureUploader...');
        
        // Check if Cropper.js is available
        if (typeof Cropper === 'undefined') {
            console.error('❌ Cropper.js is not loaded. Adding it dynamically...');
            this.loadCropperJS().then(() => {
                this.setupEventListeners();
            });
        } else {
            this.setupEventListeners();
        }
        
        this.isInitialized = true;
    }

    async loadCropperJS() {
        return new Promise((resolve, reject) => {
            // Load Cropper.js CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
            document.head.appendChild(cssLink);

            // Load Cropper.js JavaScript
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
            script.onload = () => {
                console.log('✅ Cropper.js loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load Cropper.js');
                reject(new Error('Failed to load Cropper.js'));
            };
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        // Add the file input if it doesn't exist
        if (!document.getElementById('profile-pic-input')) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'profile-pic-input';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
        }

        const profilePicContainer = document.getElementById('main-profile-pic-container');
        const fileInput = document.getElementById('profile-pic-input');

        console.log('🎯 Profile pic container:', profilePicContainer);
        console.log('📁 File input:', fileInput);

        if (profilePicContainer) {
            console.log('✅ Adding click listener to profile container');
            
            // Remove any existing listeners to prevent duplicates
            profilePicContainer.removeEventListener('click', this.handleContainerClick);
            profilePicContainer.addEventListener('click', this.handleContainerClick.bind(this));
            
            // Add visual feedback on hover
            profilePicContainer.style.cursor = 'pointer';
            
        } else {
            console.log('❌ Profile picture container not found');
        }

        if (fileInput) {
            console.log('✅ Adding change listener to file input');
            
            // Remove any existing listeners to prevent duplicates
            fileInput.removeEventListener('change', this.handleFileSelect);
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        } else {
            console.log('❌ File input not found');
        }
    }

    handleContainerClick(event) {
        console.log('🖱️ Profile picture clicked!');
        event.preventDefault();
        event.stopPropagation();
        
        // Add visual feedback
        const container = event.currentTarget;
        container.style.transform = 'scale(0.95)';
        setTimeout(() => {
            container.style.transform = 'scale(1)';
        }, 150);
        
        this.openFileDialog();
    }

    openFileDialog() {
        console.log('📂 Opening file dialog...');
        const fileInput = document.getElementById('profile-pic-input');
        if (fileInput) {
            fileInput.click();
        } else {
            console.error('❌ File input not found when trying to open dialog');
            this.showError('File upload not available. Please refresh the page.');
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
            // Clear the file input
            event.target.value = '';
            return;
        }

        console.log('✅ File validation passed');
        this.currentFile = file;
        
        // Check if Cropper is available before showing modal
        if (typeof Cropper === 'undefined') {
            console.log('⏳ Cropper.js not ready, loading...');
            this.showMessage('Loading image editor...', 'info');
            
            this.loadCropperJS().then(() => {
                this.showCropModal(file);
            }).catch(() => {
                this.showError('Failed to load image editor. Please try again.');
                event.target.value = '';
            });
        } else {
            this.showCropModal(file);
        }
    }

    validateFile(file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file (JPG, PNG, GIF, etc.)');
            return false;
        }

        // Check file size (5MB limit)
        if (file.size > this.maxFileSize) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            this.showError(`Image is too large (${sizeMB}MB). Please select an image smaller than 5MB.`);
            return false;
        }

        return true;
    }

    showCropModal(file) {
        console.log('🖼️ Showing crop modal for:', file.name);
        
        const modalHtml = `
            <div id="crop-modal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div class="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800">Crop Profile Picture</h3>
                        <button id="close-crop-modal" class="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors">&times;</button>
                    </div>
                    
                    <div class="mb-6">
                        <img id="crop-image" class="max-w-full block" style="max-height: 400px;">
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
            
            // Wait for image to load before initializing cropper
            cropImage.onload = () => {
                console.log('🖼️ Image loaded, initializing Cropper...');
                
                try {
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
                            console.log('✅ Cropper ready');
                        }
                    });
                    
                    console.log('✅ Cropper initialized successfully');
                } catch (error) {
                    console.error('❌ Error initializing Cropper:', error);
                    this.showError('Failed to initialize image editor');
                    this.closeCropModal();
                }
            };
        };
        
        reader.onerror = () => {
            console.error('❌ Error reading file');
            this.showError('Failed to read image file');
            this.closeCropModal();
        };
        
        reader.readAsDataURL(file);

        // Event listeners
        document.getElementById('close-crop-modal').addEventListener('click', () => this.closeCropModal());
        document.getElementById('cancel-crop').addEventListener('click', () => this.closeCropModal());
        document.getElementById('save-crop').addEventListener('click', () => this.saveCroppedImage());
    }

    closeCropModal() {
        console.log('🗑️ Closing crop modal');
        
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
            this.showError('Unable to save image. Please try again.');
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
        if (userData.userProfile?.profilePicture?.publicId) {
            try {
                await deleteFromCloudinary(userData.userProfile.profilePicture.publicId);
            } catch (error) {
                console.warn('Failed to delete old profile picture:', error);
            }
        }

        // Update with new profile picture
        const updatedUserProfile = {
            ...userData.userProfile,
            profilePicture: {
                url: imageUrl,
                publicId: publicId,
                updatedAt: new Date().toISOString()
            }
        };

        await setDoc(userDocRef, {
            ...userData,
            userProfile: updatedUserProfile
        }, { merge: true });
    }

    updateProfilePicture(imageUrl) {
        console.log('🔄 Updating profile picture UI with:', imageUrl);
        
        // Update main profile picture on profile page
        const mainProfilePic = document.getElementById('main-profile-pic');
        const mainAvatar = document.getElementById('main-avatar');
        
        if (mainProfilePic && mainAvatar) {
            mainProfilePic.src = imageUrl;
            mainProfilePic.classList.remove('hidden');
            mainAvatar.classList.add('hidden');
            console.log('✅ Updated main profile picture');
        }

        // Also update header profile picture for consistency (if it exists)
        const headerProfilePic = document.getElementById('user-profile-pic');
        const headerAvatar = document.getElementById('user-avatar');
        
        if (headerProfilePic && headerAvatar) {
            headerProfilePic.src = imageUrl;
            headerProfilePic.classList.remove('hidden');
            headerAvatar.classList.add('hidden');
            console.log('✅ Updated header profile picture');
        }

        // Update dashboard profile picture (if exists - when user navigates there)
        const dashboardProfilePic = document.querySelector('#user-profile-pic');
        if (dashboardProfilePic) {
            dashboardProfilePic.src = imageUrl;
            console.log('✅ Updated dashboard profile picture');
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Try to use the existing status message system first
        if (window.showStatusMessage) {
            window.showStatusMessage(message, type);
            return;
        }

        // Fallback to creating our own message display
        const messageArea = document.getElementById('status-message-area') || document.body;
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        const messageId = `message-${Date.now()}`;
        
        const messageHtml = `
            <div id="${messageId}" class="fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full">
                <div class="flex items-center justify-between">
                    <span>${message}</span>
                    <button onclick="document.getElementById('${messageId}').remove()" class="ml-4 text-white hover:text-gray-200">
                        ×
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', messageHtml);
        
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

// Global instance to prevent multiple initializations
let profilePictureUploaderInstance = null;

// Initialize when DOM is loaded, but check for main profile container periodically
document.addEventListener('DOMContentLoaded', () => {
    // Check if main profile container exists, if not wait for it
    function initializeUploader() {
        if (profilePictureUploaderInstance) {
            console.log('⚠️ ProfilePictureUploader already exists, skipping initialization');
            return;
        }

        const mainContainer = document.getElementById('main-profile-pic-container');
        if (mainContainer) {
            console.log('🎯 Found main profile container, initializing uploader');
            profilePictureUploaderInstance = new ProfilePictureUploader();
        } else {
            // Wait and try again (profile content might still be loading)
            console.log('⏳ Main profile container not found, waiting...');
            setTimeout(initializeUploader, 500);
        }
    }
    
    initializeUploader();
});

// Make ProfilePictureUploader available globally
window.ProfilePictureUploader = ProfilePictureUploader;

export default ProfilePictureUploader;
