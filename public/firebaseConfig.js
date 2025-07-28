import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    OAuthProvider, 
    signInWithPopup, 
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const CLOUDINARY_CLOUD_NAME = 'dxf6jiu6z'; 
const CLOUDINARY_UPLOAD_PRESET = 'profile_pics';

const firebaseConfig = window.userFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function uploadToCloudinary(file) {
    console.log('🔄 Starting Cloudinary upload...');
    console.log('📁 File:', file.name, file.size, file.type);
    console.log('☁️ Cloud Name:', CLOUDINARY_CLOUD_NAME);
    console.log('🎯 Upload Preset:', CLOUDINARY_UPLOAD_PRESET);
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'health-overview/profile-pics');
        formData.append('transformation', 'c_fill,w_400,h_400,q_auto,f_auto');
        
        console.log('📤 Sending request to Cloudinary...');
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Upload failed response:', errorText);
            
            // Try fallback without upload preset
            console.log('🔄 Trying fallback upload without preset...');
            return await uploadToCloudinaryFallback(file);
        }
        
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('💥 Cloudinary upload error:', error);
        // Try fallback approach
        console.log('🔄 Trying fallback approach...');
        return await uploadToCloudinaryFallback(file);
    }
}

async function uploadToCloudinaryFallback(file) {
    console.log('🔧 Using fallback upload method...');
    
    try {
        // Convert file to base64 for unsigned upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default'); // Default unsigned preset
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            console.log('❌ Fallback also failed, using local storage...');
            return await uploadToLocalStorage(file);
        }
        
        const result = await response.json();
        console.log('✅ Fallback upload successful:', result);
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('💥 Fallback also failed:', error);
        return await uploadToLocalStorage(file);
    }
}

async function uploadToLocalStorage(file) {
    console.log('💾 Using local storage as final fallback...');
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            
            // Store in localStorage with a unique key
            const timestamp = Date.now();
            const key = `profile_pic_${timestamp}`;
            
            try {
                // Check if we have space (localStorage limit is ~5-10MB)
                if (dataUrl.length > 5000000) { // 5MB limit
                    console.warn('⚠️ Image too large for localStorage, compressing...');
                    // Create a compressed version
                    compressAndStore(file, resolve, reject);
                } else {
                    localStorage.setItem(key, dataUrl);
                    console.log('✅ Stored in localStorage:', key);
                    resolve({
                        url: dataUrl,
                        publicId: key,
                        isLocal: true
                    });
                }
            } catch (storageError) {
                console.error('💥 localStorage failed:', storageError);
                // As last resort, use blob URL
                const blobUrl = URL.createObjectURL(file);
                resolve({
                    url: blobUrl,
                    publicId: `blob_${timestamp}`,
                    isBlob: true
                });
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function compressAndStore(file, resolve, reject) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Compress to reasonable size
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const compressedDataUrl = e.target.result;
                const timestamp = Date.now();
                const key = `profile_pic_${timestamp}`;
                
                try {
                    localStorage.setItem(key, compressedDataUrl);
                    console.log('✅ Compressed and stored in localStorage:', key);
                    resolve({
                        url: compressedDataUrl,
                        publicId: key,
                        isLocal: true
                    });
                } catch (error) {
                    // Final fallback to blob URL
                    const blobUrl = URL.createObjectURL(blob);
                    resolve({
                        url: blobUrl,
                        publicId: `blob_${timestamp}`,
                        isBlob: true
                    });
                }
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.7);
    };
    
    img.src = URL.createObjectURL(file);
}

async function deleteFromCloudinary(publicId) {
    console.log('Delete publicId:', publicId);
}
function updateUserProfilePicture(userData, displayName) {
    const userProfilePic = document.getElementById('user-profile-pic');
    const userAvatar = document.getElementById('user-avatar');
    
    if (!userProfilePic || !userAvatar) return;
    
    const profilePictureUrl = userData?.userProfile?.profilePicture?.url || userData?.profilePicture?.url;
    
    if (profilePictureUrl) {
        userProfilePic.src = profilePictureUrl;
        userProfilePic.classList.remove('hidden');
        userAvatar.classList.add('hidden');
    } else if (displayName) {
        const initial = displayName.charAt(0).toUpperCase();
        userAvatar.textContent = initial;
        userAvatar.classList.remove('hidden');
        userProfilePic.classList.add('hidden');
    }
}

export { 
    app, 
    auth, 
    db, 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    OAuthProvider, 
    signInWithPopup, 
    signInAnonymously,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    uploadToCloudinary,
    deleteFromCloudinary,
    updateUserProfilePicture
};