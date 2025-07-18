const functions = require('firebase-functions');
const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp();

exports.authRedirect = functions.https.onRequest((req, res) => {
  // Allow access to login.html, firebaseConfig.js, and static assets without auth
  if (
    req.path === '/login.html' ||
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
    // Not authenticated, redirect to login
    return res.redirect('/login.html');
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
      // Invalid token, redirect to login
      res.redirect('/login.html');
    });
});
