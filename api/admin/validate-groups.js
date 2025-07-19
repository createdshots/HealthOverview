// api/admin/validate-groups.js
import { adminAuth } from '../../../lib/firebase-admin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { accessToken, userEmail } = req.body;

        if (!accessToken || !userEmail) {
            return res.status(400).json({ error: 'Access token and user email required' });
        }

        // Verify email domain
        if (!userEmail.endsWith('@healthoverview.info')) {
            return res.status(403).json({ error: 'Invalid email domain' });
        }

        // Get user groups from Microsoft Graph
        const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!graphResponse.ok) {
            throw new Error(`Microsoft Graph API error: ${graphResponse.status}`);
        }

        const graphData = await graphResponse.json();
        const userGroups = graphData.value
            .filter(group => group['@odata.type'] === '#microsoft.graph.group')
            .map(group => group.displayName);

        // Get allowed admin groups from environment
        const allowedGroups = process.env.ADMIN_GROUPS 
            ? process.env.ADMIN_GROUPS.split(',').map(g => g.trim())
            : ['HealthOverview-Admins', 'HealthOverview-Moderators', 'HealthOverview-Support'];

        // Find matching admin groups
        const adminGroups = userGroups.filter(group => allowedGroups.includes(group));

        if (adminGroups.length === 0) {
            return res.status(403).json({ 
                error: 'User is not a member of any admin groups',
                userGroups: userGroups,
                requiredGroups: allowedGroups
            });
        }

        // Determine admin level
        let adminLevel = 'none';
        if (adminGroups.includes('HealthOverview-Admins')) {
            adminLevel = 'full';
        } else if (adminGroups.includes('HealthOverview-Moderators')) {
            adminLevel = 'moderate';
        } else if (adminGroups.includes('HealthOverview-Support')) {
            adminLevel = 'readonly';
        }

        res.status(200).json({
            success: true,
            adminGroups: adminGroups,
            adminLevel: adminLevel,
            allGroups: userGroups
        });

    } catch (error) {
        console.error('❌ Error validating groups:', error);
        res.status(500).json({ 
            error: 'Failed to validate admin groups',
            details: error.message 
        });
    }
}