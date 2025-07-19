// Import the functions you need from the SDKs you need
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

const CLOUDINARY_CLOUD_NAME = 'HealthOverview'; 
const CLOUDINARY_UPLOAD_PRESET = 'profile_pics';

const firebaseConfig = window.userFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function uploadToCloudinary(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'health-overview/profile-pics');
        formData.append('transformation', 'c_fill,w_400,h_400,q_auto,f_auto');
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
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
        // Show profile picture if available
        userProfilePic.src = profilePictureUrl;
        userProfilePic.classList.remove('hidden');
        userAvatar.classList.add('hidden');
    } else if (displayName) {
        // Fall back to avatar initial if no profile picture
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