import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let firebaseAdminApp;
export let isFirebaseAdminConfigured = false;

try {
  if (!admin.apps.length) {
    // 1. Check if serviceAccountKey.json file exists in backend folder in VS Code
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        if (
          serviceAccount.project_id && 
          serviceAccount.project_id !== 'your-firebase-project-id' &&
          serviceAccount.private_key && 
          serviceAccount.private_key.includes('BEGIN PRIVATE KEY') &&
          !serviceAccount.private_key.includes('YOUR_PRIVATE_KEY_HERE')
        ) {
          firebaseAdminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          isFirebaseAdminConfigured = true;
          console.log('✅ Firebase Admin SDK initialized using backend/serviceAccountKey.json in VS Code.');
        }
      } catch (fileErr) {
        console.warn('⚠️ Could not parse backend/serviceAccountKey.json:', fileErr.message);
      }
    }

    // 2. Fallback to process.env if serviceAccountKey.json is not present or contains placeholders
    if (!isFirebaseAdminConfigured) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

      const isRealPrivateKey = Boolean(
        privateKey && 
        privateKey.includes('BEGIN PRIVATE KEY') && 
        !privateKey.includes('YOUR_PRIVATE_KEY_HERE')
      );
        
      const isRealProjectId = Boolean(projectId && projectId !== 'your_firebase_project_id');

      if (isRealProjectId && clientEmail && isRealPrivateKey) {
        firebaseAdminApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        isFirebaseAdminConfigured = true;
        console.log('✅ Firebase Admin SDK initialized successfully with Service Account credentials from .env.');
      } else {
        console.log('ℹ️ Firebase running in Development / Demo Mode. Automatic user authentication active.');
      }
    }
  } else {
    firebaseAdminApp = admin.apps[0];
    isFirebaseAdminConfigured = true;
  }
} catch (error) {
  console.warn('⚠️ Notice initializing Firebase Admin SDK (Relying on dev authentication):', error.message);
}

export default admin;
