// api/auth/verify.js
import { withAuth } from '../../lib/auth-middleware.js';

async function handler(req, res) {
  // If we get here, the token is valid (thanks to withAuth middleware)
  res.status(200).json({ 
    valid: true, 
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    }
  });
}

export default withAuth(handler);