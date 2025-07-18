// Use environment variables in production, fallback to hardcoded values in development
const userFirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDXJQOLf7tkzeu0z2TFvzaiXtdDVfwgTWU",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "healthoverview-info.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "healthoverview-info",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "healthoverview-info.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "712121936430",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:712121936430:web:3a0afcdfd0a9034adc8dbf",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-NQ9XKQJZYB"
};

// Make config available globally for secure access
if (typeof window !== 'undefined') {
    window.userFirebaseConfig = userFirebaseConfig;
    console.log('Firebase config loaded from:', process.env.NODE_ENV === 'production' ? 'environment variables' : 'development defaults');
}