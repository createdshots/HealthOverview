// api/admin/setclaims.js
import { adminAuth } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify the request is from an authenticated user
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Verify the user has @healthoverview.info domain
        if (!decodedToken.email || !decodedToken.email.endsWith('@healthoverview.info')) {
            return res.status(403).json({ error: 'Invalid domain' });
        }

        const { uid, claims } = req.body;

        // Verify the requesting user is setting claims for themselves
        if (decodedToken.uid !== uid) {
            return res.status(403).json({ error: 'Can only set claims for self' });
        }

        // Validate admin groups from environment
        const allowedGroups = process.env.ADMIN_GROUPS 
            ? process.env.ADMIN_GROUPS.split(',').map(g => g.trim())
            : ['HealthOverview-Admins', 'HealthOverview-Moderators', 'HealthOverview-Support'];

        // Validate that the user's groups are in the allowed list
        if (claims.groups && Array.isArray(claims.groups)) {
            const validGroups = claims.groups.filter(group => allowedGroups.includes(group));
            if (validGroups.length === 0) {
                return res.status(403).json({ error: 'No valid admin groups found' });
            }
            // Only set claims for valid groups
            claims.groups = validGroups;
        }

        // Set the custom claims
        await adminAuth.setCustomUserClaims(uid, claims);

        console.log(`✅ Set admin claims for ${decodedToken.email}:`, claims);
        res.status(200).json({ 
            success: true, 
            message: 'Admin claims set successfully',
            claimsSet: claims 
        });

    } catch (error) {
        console.error('❌ Error setting custom claims:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}