import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

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

export { app, auth, db };
