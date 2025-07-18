// api/users/[userId].js
import { adminDb } from '../../lib/firebase-admin.js';
import { withAuth } from '../../lib/auth-middleware.js';

async function handler(req, res) {
  const { userId } = req.query;
  
  // Ensure user can only access their own data
  if (req.user.uid !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    if (req.method === 'GET') {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      res.status(200).json({ data: userData });
    }
    
    else if (req.method === 'POST' || req.method === 'PUT') {
      const { data } = req.body;
      await adminDb.collection('users').doc(userId).set(data, { merge: true });
      res.status(200).json({ success: true });
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);