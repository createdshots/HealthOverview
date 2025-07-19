// Admin stats API endpoint
import { adminDb } from '../../../lib/firebase-admin.js';
import { withAuth } from '../../../lib/auth-middleware.js';

async function handler(req, res) {
    // Verify admin access
    if (!req.user.email || !req.user.email.endsWith('@healthoverview.info')) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        if (req.method === 'GET') {
            // Get user statistics
            const usersSnapshot = await adminDb.collection('users').get();
            let totalUsers = 0;
            let authenticatedUsers = 0;
            let guestUsers = 0;
            let totalRecords = 0;

            usersSnapshot.docs.forEach(doc => {
                const userData = doc.data();
                totalUsers++;
                
                if (userData.userProfile?.email || userData.email) {
                    authenticatedUsers++;
                } else {
                    guestUsers++;
                }

                totalRecords += (userData.medicalRecords || []).length;
            });

            const stats = {
                totalUsers,
                authenticatedUsers,
                guestUsers,
                totalRecords,
                lastUpdated: new Date().toISOString()
            };

            res.status(200).json(stats);

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('Admin stats API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export default withAuth(handler);