// Admin API endpoint for user management
import { adminDb, adminAuth } from '../../../lib/firebase-admin.js';
import { withAuth } from '../../../lib/auth-middleware.js';

async function handler(req, res) {
    // Verify admin access
    if (!req.user.email || !req.user.email.endsWith('@healthoverview.info')) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        if (req.method === 'GET') {
            // Get all users
            const usersSnapshot = await adminDb.collection('users').get();
            const users = [];

            for (const doc of usersSnapshot.docs) {
                const userData = doc.data();
                const uid = doc.id;

                try {
                    // Get user record from Firebase Auth
                    const userRecord = await adminAuth.getUser(uid);
                    
                    users.push({
                        uid: uid,
                        email: userRecord.email,
                        displayName: userRecord.displayName || userData.userProfile?.displayName,
                        isAnonymous: !userRecord.email,
                        lastActive: userData.lastActive || userRecord.metadata.lastSignInTime,
                        recordCount: (userData.medicalRecords || []).length,
                        createdAt: userRecord.metadata.creationTime,
                        emailVerified: userRecord.emailVerified
                    });
                } catch (authError) {
                    // User might not exist in Auth but has Firestore data
                    console.warn('User not found in Auth:', uid);
                    users.push({
                        uid: uid,
                        email: 'Unknown',
                        displayName: userData.userProfile?.displayName || 'Unknown',
                        isAnonymous: true,
                        lastActive: userData.lastActive,
                        recordCount: (userData.medicalRecords || []).length,
                        createdAt: null,
                        emailVerified: false
                    });
                }
            }

            res.status(200).json(users);

        } else if (req.method === 'DELETE') {
            const { userId } = req.query;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }

            // Delete from Firestore
            await adminDb.collection('users').doc(userId).delete();

            // Delete from Firebase Auth
            try {
                await adminAuth.deleteUser(userId);
            } catch (authError) {
                console.warn('User not found in Auth during deletion:', userId);
            }

            res.status(200).json({ success: true });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('Admin API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default withAuth(handler);