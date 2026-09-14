/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase client — synapse-ai-inovation.
 * Web API key is public by design; rules enforce access.
 * Override via VITE_FIREBASE_* env vars when deploying forks.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env ?? {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDEZ4hVJXQVL_1df3Srs4utBDhweScBIjI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'synapse-ai-inovation.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'synapse-ai-inovation',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'synapse-ai-inovation.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_SENDER_ID ?? '907716016412',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:907716016412:web:12179a83848ddc8067a2d9',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-4R980HGEV2',
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const firebaseApp: FirebaseApp = app;
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Analytics is optional + browser-only; dynamically imported to keep SSR/build safe.
export async function initAnalytics(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (await isSupported()) getAnalytics(app);
  } catch {
    /* analytics unavailable — non-fatal */
  }
}
