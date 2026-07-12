import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBOwc-9aIh3STo7ZIijtZmhrw39O5NJGBc",
  authDomain: "chat-app-cefc0.firebaseapp.com",
  databaseURL: "https://chat-app-cefc0-default-rtdb.firebaseio.com",
  projectId: "chat-app-cefc0",
  storageBucket: "chat-app-cefc0.firebasestorage.app",
  messagingSenderId: "1068520941708",
  appId: "1:1068520941708:web:f6b144c253e94a484d73a9",
  measurementId: "G-PVNMDV9W3N"
};

const databaseId = "ai-studio-73496abc-00ad-484c-9bf4-4b5d85c6e34e";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with the specific custom database ID
const db = getFirestore(app, databaseId);

// Enable Offline Persistence safely
try {
  enableMultiTabIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed-precondition: Multiple tabs open. Falling back to default caching.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence unimplemented in this browser.');
      }
    });
} catch (err) {
  console.error('Error enabling Firestore offline persistence:', err);
}

// Validate Connection to Firestore on startup as per critical guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'connection-test'));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firebase client is offline. Please check your network or Firebase configuration.");
    } else {
      console.log("Firestore initialized and verified successfully.");
    }
  }
}
testConnection();

// Firestore error handling declarations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const isPermissionDenied = error instanceof Error && (
    error.message.includes('permission-denied') ||
    error.message.includes('Missing or insufficient permissions') ||
    (error as any).code === 'permission-denied'
  );

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  const errMessage = JSON.stringify(errInfo);
  console.error('Firestore Error recorded:', errMessage);
  
  if (isPermissionDenied) {
    throw new Error(errMessage);
  } else if (error instanceof Error) {
    throw error;
  } else {
    throw new Error(String(error));
  }
}

export function getFriendlyErrorMessage(err: any): string {
  if (!err) return 'An unknown error occurred';
  const msg = err.message || String(err);
  if (msg.startsWith('{') && msg.includes('operationType')) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error && (parsed.error.includes('permission-denied') || parsed.error.includes('insufficient permissions'))) {
        return 'Access Denied: You do not have permissions to perform this action.';
      }
      return parsed.error || msg;
    } catch (e) {
      // ignore parsing error
    }
  }

  // Check common firebase authentication and other database errors
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
    return 'Invalid email or password credentials.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'This email address is already in use by another account.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Password is too weak. Must be at least 6 characters.';
  }
  if (msg.includes('permission-denied') || msg.includes('insufficient permissions')) {
    return 'Access Denied: You do not have permissions to perform this action.';
  }
  if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('failed-precondition')) {
    return 'The student workspace is currently offline or the connection is temporarily unavailable. Retrying...';
  }
  if (msg.includes('network-request-failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  return msg;
}

export { app, auth, db };
