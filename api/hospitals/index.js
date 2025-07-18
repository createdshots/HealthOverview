// api/hospitals/index.js
import { adminDb } from '../../lib/firebase-admin.js';
import { withAuth } from '../../lib/auth-middleware.js';

async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const hospitalsSnapshot = await adminDb.collection('hospitals').get();
      const hospitals = hospitalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      res.status(200).json({ hospitals });
    }
    
    else if (req.method === 'POST') {
      const { name, location, type } = req.body;
      const newHospital = {
        name,
        location,
        type,
        createdBy: req.user.uid,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await adminDb.collection('hospitals').add(newHospital);
      res.status(201).json({ id: docRef.id, ...newHospital });
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling hospitals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);