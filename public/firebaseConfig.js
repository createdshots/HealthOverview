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
            throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('💥 Cloudinary upload error:', error);
        throw error;
    }
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