// src/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  profilePic?: string;
  bookmarkedTopics: string[];
  archivedTopics: string[];
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isStable: boolean; // Add this flag
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStable, setIsStable] = useState(false); // Add isStable state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔐 Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          console.log('🔥 Auth state changed: User detected', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let profile: UserProfile;
          
          if (userDoc.exists()) {
            console.log('✅ Found existing profile');
            profile = {
              id: firebaseUser.uid,
              ...userDoc.data()
            } as UserProfile;
          } else {
            console.log('🆕 Creating new profile');
            profile = {
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              profilePic: firebaseUser.photoURL || undefined,
              bookmarkedTopics: [],
              archivedTopics: []
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), profile);
          }
          
          setUser(firebaseUser);
          setUserProfile(profile);
        } else {
          console.log('🚪 No user found or user signed out');
          setUser(null);
          setUserProfile(null);
        }
        setError(null);
      } catch (err) {
        console.error('❌ Auth error:', err);
        setError(err instanceof Error ? err.message : 'Auth error');
      } finally {
        setLoading(false);
        setIsStable(true); // Mark auth as stable once initial loading is complete
        console.log('🔒 Auth state stabilized');
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔑 Attempting login with:', email);
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('🎉 Login successful');
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 Attempting logout');
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      // Explicitly clear local state
      setUser(null);
      setUserProfile(null);
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('❌ Logout failed:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    console.log('📝 Attempting signup for:', email);
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('🔐 User created, setting up profile');
      const profile: UserProfile = {
        id: userCredential.user.uid,
        displayName,
        email,
        profilePic: null,
        bookmarkedTopics: [],
        archivedTopics: []
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), profile);
      console.log('✅ Signup successful');
    } catch (err) {
      console.error('❌ Signup failed:', err);
      setError(err instanceof Error ? err.message : 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isStable, // Include the isStable flag in context
      error,
      login,
      logout,
      signup
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};