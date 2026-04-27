import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  updateProfile, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
if (!firebaseConfig || !firebaseConfig.projectId) {
  console.error("Firebase configuration is missing or invalid in firebase-applet-config.json");
} else {
  console.log("Initializing Firebase with project:", firebaseConfig.projectId);
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Standard error handler for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Initial site config seed - DISABLED after initial seed to save quota
/*
async function seedConfig() {
  const configRef = doc(db, 'config', 'site');
  try {
    const snap = await getDoc(configRef);
    if (!snap.exists()) {
      await setDoc(configRef, {
        brandColor: '#8B5CF6',
        splashText: 'CrazyGuiscripts',
        splashOwner: 'D4vidskys',
        aiTitle: 'Crazy IA',
        aiSubtitle: 'Discover latest scripts with AI power',
        aiSuggestions: 'Blox Fruits Auto Farm, Haze Piece Script, Hoho Hub, OMG Hub Script'
      });
      console.log("Seed config created.");
    }
  } catch (e) {
    console.warn("Seed config failed (likely permissions or offline):", e);
  }
}
setTimeout(() => seedConfig(), 2000);
*/

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Sync Helper
export async function syncUserProfile(user: User) {
  // Use session storage to avoid redundant syncs in the same session
  const SESSION_SYNC_KEY = `synced_${user.uid}`;
  if (sessionStorage.getItem(SESSION_SYNC_KEY)) return;

  const userRef = doc(db, 'users', user.uid);
  const emailRef = doc(db, 'users', user.uid, 'private', 'email');
  
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      // Create new user (public)
      try {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      }
    } else {
      // Only update if last login was more than 4 hours ago to save quota
      const data = userDoc.data();
      const lastLogin = data?.lastLogin?.toMillis?.() || 0;
      const fourHours = 4 * 60 * 60 * 1000;
      
      if (Date.now() - lastLogin > fourHours) {
        try {
          await updateDoc(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    }

    // Email sync - also conditional
    const emailSnap = await getDoc(emailRef);
    if (!emailSnap.exists() || emailSnap.data()?.email !== user.email) {
      try {
        await setDoc(emailRef, {
          email: user.email,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/private/email`);
      }
    }

    sessionStorage.setItem(SESSION_SYNC_KEY, 'true');

  } catch (error) {
    if ((error as any).code === 'permission-denied') {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    }
    // Silently skip sync if quota exceeded or offline
    const isQuotaError = (error as any).code === 'resource-exhausted' || (error instanceof Error && error.message.includes('Quota exceeded'));
    if (!isQuotaError && !(error instanceof Error && error.message.includes('authInfo'))) {
       console.error("Profile sync error:", error);
    }
  }
}

// Test connection DISABLED to save quota
/*
async function testConnection(retries = 3) {
  try {
    console.log("Testing Firestore connection...");
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test completed.");
  } catch (error) {
    if (retries > 0) {
      console.warn(`Firestore connection attempt failed. Retrying... (${retries} left)`);
      setTimeout(() => testConnection(retries - 1), 2000);
      return;
    }
    console.error("Firestore testConnection failed after retries:", error);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is reporting as offline.");
    }
  }
}
// Delay slightly to give the network/SDK a moment to init
setTimeout(() => testConnection(), 1000);
*/

export { 
  signInWithPopup, 
  onAuthStateChanged, 
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut
};
export type { User };
