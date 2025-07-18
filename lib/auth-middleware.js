// lib/auth-middleware.js
import { adminAuth } from './firebase-admin.js';

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    
    if (next) next();
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function withAuth(handler) {
  return async (req, res) => {
    const user = await verifyToken(req, res);
    if (!user) return; // Response already sent by verifyToken
    
    req.user = user;
    return handler(req, res);
  };
}