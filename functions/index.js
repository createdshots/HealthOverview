const functions = require('firebase-functions');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

admin.initializeApp();

// Serve authentication JavaScript dynamically
exports.authScript = functions.https.onRequest((req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'no-cache');
  
  // Read and serve the auth script
  const authScript = fs.readFileSync(path.join(__dirname, 'client-scripts', 'auth.js'), 'utf8');
  res.send(authScript);
});

// Serve login JavaScript dynamically  
exports.loginScript = functions.https.onRequest((req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'no-cache');
  
  const loginScript = fs.readFileSync(path.join(__dirname, 'client-scripts', 'login.js'), 'utf8');
  res.send(loginScript);
});

exports.authRedirect = functions.https.onRequest((req, res) => {
  // Allow access to index.html (login page), firebaseConfig.js, and static assets without auth
  if (
    req.path === '/' ||
    req.path === '/index.html' ||
    req.path === '/firebaseConfig.js' ||
    req.path === '/favicon.ico' ||
    req.path.startsWith('/__/') || // Firebase internal
    req.path.startsWith('/static/') ||
    req.path.startsWith('/styles/') ||
    req.path.startsWith('/logo.svg')
  ) {
    return res.sendFile(path.join(__dirname, '../public', req.path));
  }

  // Check for Firebase Auth token in cookies or Authorization header
  const idToken =
    req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1]
      : req.cookies?.__session;

  if (!idToken) {
    // Not authenticated, redirect to login (index.html)
    return res.redirect('/');
  }

  // Verify token
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(() => {
      // Authenticated, serve requested file
      res.sendFile(path.join(__dirname, '../public', req.path));
    })
    .catch(() => {
      // Invalid token, redirect to login (index.html)
      res.redirect('/');
    });
});
