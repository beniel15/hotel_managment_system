
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let firebaseAdminApp;
export let isFirebaseAdminConfigured = false;

const isProduction = process.env.NODE_ENV === 'production';

try {
  if (admin.apps.length) {
    firebaseAdminApp = admin.apps[0];
    isFirebaseAdminConfigured = true;
  } else {
    let serviceAccount = null;

    // 1. Local development: read service account file
    const serviceAccountPath = path.join(
      process.cwd(),
      'serviceAccountKey.json'
    );

    if (fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, 'utf8')
        );
      } catch (error) {
        console.warn('Could not read service account file:', error.message);
      }
    }

    // 2. Render: read credentials from environment variables
    if (!serviceAccount) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        serviceAccount = {
          projectId,
          clientEmail,
          privateKey,
        };
      }
    }

    // 3. Initialize Firebase Admin
    if (
      serviceAccount?.project_id || serviceAccount?.projectId
    ) {
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      isFirebaseAdminConfigured = true;
      console.log('Firebase Admin SDK initialized successfully.');
    } else if (isProduction) {
      throw new Error(
        'Firebase credentials are missing. Production startup aborted.'
      );
    } else {
      console.warn('Firebase running in local development/demo mode.');
    }
  }
} catch (error) {
  if (isProduction) {
    throw error;
  }

  console.warn('Firebase initialization warning:', error.message);
}

export default admin;
