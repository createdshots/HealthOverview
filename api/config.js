// API endpoint to serve Firebase config with environment variables
export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300');
    
    const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDXJQOLf7tkzeu0z2TFvzaiXtdDVfwgTWU",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "healthoverview-info.firebaseapp.com",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "healthoverview-info",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "healthoverview-info.firebasestorage.app",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "712121936430",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:712121936430:web:3a0afcdfd0a9034adc8dbf",
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-NQ9XKQJZYB"
    };
    
    const script = `
(function() {
    'use strict';
    
    const userFirebaseConfig = ${JSON.stringify(config)};
    
    if (typeof window !== 'undefined') {
        window.userFirebaseConfig = userFirebaseConfig;
        console.log('Firebase config loaded from API endpoint');
    }
})();
    `;
    
    res.status(200).send(script);
}