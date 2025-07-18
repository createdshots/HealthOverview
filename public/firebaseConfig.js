// Firebase Configuration for client-side use
(function() {
    'use strict';
    
    // For client-side code, we need to use hardcoded values or build-time replacement
    // Vercel can inject environment variables at build time, but for static files we need a different approach
    
    const userFirebaseConfig = {
        apiKey: "AIzaSyDXJQOLf7tkzeu0z2TFvzaiXtdDVfwgTWU",
        authDomain: "healthoverview-info.firebaseapp.com",
        projectId: "healthoverview-info",
        storageBucket: "healthoverview-info.firebasestorage.app",
        messagingSenderId: "712121936430",
        appId: "1:712121936430:web:3a0afcdfd0a9034adc8dbf",
        measurementId: "G-NQ9XKQJZYB"
    };

    // Make config available globally
    if (typeof window !== 'undefined') {
        window.userFirebaseConfig = userFirebaseConfig;
        console.log('Firebase config loaded successfully');
    } else {
        console.error('Window object not available');
    }
})();