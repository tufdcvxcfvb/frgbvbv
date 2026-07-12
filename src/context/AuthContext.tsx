import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { getOrCreateDeviceId, getDeviceDetails } from '../hooks/useDevToolsDetector';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign Up
  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fUser = userCredential.user;

      // Update Firebase Profile Name
      await updateProfile(fUser, { displayName: name });

      // Gather device details
      const deviceId = getOrCreateDeviceId();
      const details = getDeviceDetails();
      const nowString = new Date().toISOString();

      const userProfile: UserProfile = {
        uid: fUser.uid,
        name,
        email,
        role: 'user',
        status: 'active',
        deviceId,
        browser: details.browser,
        os: details.os,
        ip: '127.0.0.1', // Mocked or fetched; local default
        createdAt: nowString,
        lastLogin: nowString,
        lastSeen: nowString,
        photoURL: fUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        devToolOpenCount: 0,
        devToolTotalTime: 0,
        blocked: false
      };

      // Create doc in Firestore
      await setDoc(doc(db, 'users', fUser.uid), userProfile);
      setUser(userProfile);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fUser = userCredential.user;

      // Check current profile first to see if blocked
      const userDocRef = doc(db, 'users', fUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        if (profile.blocked) {
          await signOut(auth);
          throw new Error('Your account has been blocked.');
        }

        const nowString = new Date().toISOString();
        const details = getDeviceDetails();

        // Update profile in database
        await updateDoc(userDocRef, {
          lastLogin: nowString,
          lastSeen: nowString,
          browser: details.browser,
          os: details.os
        });
      }
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    if (firebaseUser) {
      try {
        const nowString = new Date().toISOString();
        // Update offline timestamp before logging out
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastSeen: nowString
        });
      } catch (err) {
        console.error('Error updating logout timestamp:', err);
      }
    }
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  // Listen to Auth State Changes
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);

      if (fUser) {
        const userDocRef = doc(db, 'users', fUser.uid);
        
        // Listen in real-time to the profile to handle instantaneous block commands
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data() as UserProfile;
            
            // Check if blocked or status suspended
            if (profile.blocked || profile.status === 'suspended') {
              // Sign out immediately and clear states
              signOut(auth).then(() => {
                setUser(null);
                setFirebaseUser(null);
                setLoading(false);
                // Trigger page refresh to hit the blocked redirect
                window.location.href = '/account-blocked';
              });
              return;
            }

            setUser(profile);
          } else {
            console.warn('User document does not exist in Firestore yet.');
          }
          setLoading(false);
        }, (err) => {
          console.error('Error listening to user profile changes:', err);
          setLoading(false);
        });

      } else {
        setUser(null);
        setLoading(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // Heartbeat - Update lastSeen every 30 seconds while user is online
  useEffect(() => {
    if (!user?.uid || user?.blocked) return;

    const interval = setInterval(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastSeen: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error in status heartbeat:', err);
      }
    }, 30000);

    // Update offline timestamp when page/tab closes
    const handleBeforeUnload = () => {
      const userDocRef = doc(db, 'users', user.uid);
      updateDoc(userDocRef, {
        lastSeen: new Date().toISOString()
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.uid, user?.blocked]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
