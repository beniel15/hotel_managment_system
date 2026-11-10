import admin, { isFirebaseAdminConfigured } from '../config/firebaseAdmin.js';

export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Missing or invalid Authorization header (expected Bearer token).' 
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    // If Firebase Admin SDK is initialized with real credentials, cryptographically verify token signature
    if (isFirebaseAdminConfigured && admin.apps.length) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0],
        photoURL: decodedToken.picture || '',
        emailVerified: decodedToken.email_verified || false,
        firebaseToken: decodedToken
      };
      return next();
    }


    // Dev fallback if environment variables are not yet configured in local environment
    console.warn('⚠️ Firebase Admin SDK uninitialized. Relying on development token fallback mode.');
    req.user = {
      uid: idToken.length > 20 ? idToken.substring(0, 28) : idToken,
      email: req.headers['x-user-email'] || 'authenticated-user@gmail.com',
      role: req.headers['x-user-role'] || 'user'
    };
    next();
  } catch (error) {
    console.error('❌ Firebase Token Verification Error:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: Invalid or expired Firebase ID token.', 
      error: error.message 
    });
  }
};

