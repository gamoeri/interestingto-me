// src/context/TopicsContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  collection, addDoc, deleteDoc, doc, updateDoc, getDoc,
  query, where, getDocs, arrayUnion, arrayRemove, 
  onSnapshot, serverTimestamp, writeBatch, orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Topic {
  id: string;
  name: string;
  userId: string;
  createdAt: any;
  updatedAt?: any;
  content?: string;
  archived?: boolean; // Changed to direct property
}

interface TopicsContextType {
  activeTopics: Topic[];
  archivedTopics: Topic[];
  bookmarkedTopics: Topic[];
  topics: Topic[]; 
  loading: boolean;
  error: string | null;
  addTopic: (name: string) => Promise<Topic | null>;
  deleteTopic: (topicId: string) => Promise<boolean>;
  toggleArchiveTopic: (topicId: string) => Promise<boolean>;
  toggleBookmark: (topicId: string) => Promise<boolean>;
}

const TopicsContext = createContext<TopicsContextType>({
  activeTopics: [],
  archivedTopics: [],
  bookmarkedTopics: [],
  topics: [],
  loading: true,
  error: null,
  addTopic: async () => null,
  deleteTopic: async () => false,
  toggleArchiveTopic: async () => false,
  toggleBookmark: async () => false
});

export function TopicsProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeTopics, setActiveTopics] = useState<Topic[]>([]);
  const [archivedTopics, setArchivedTopics] = useState<Topic[]>([]);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const topicsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Add topic
  const addTopic = useCallback(async (name: string) => {
    if (!user?.uid || !name.trim()) {
      console.log('[TopicsContext] Cannot add topic: No user or empty name');
      return null;
    }

    try {
      console.log('[TopicsContext] Adding new topic:', name);
      const docRef = await addDoc(collection(db, 'topics'), {
        name: name.trim(),
        userId: user.uid,
        archived: false, // Initialize with not archived
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[TopicsContext] Topic added successfully:', docRef.id);
      
      return { 
        id: docRef.id, 
        name: name.trim(),
        userId: user.uid,
        archived: false,
        createdAt: new Date()
      };
    } catch (err) {
      console.error('[TopicsContext] Add topic failed:', err);
      return null;
    }
  }, [user?.uid]);

  // Delete topic
  const deleteTopic = useCallback(async (topicId: string) => {
    if (!user?.uid) return false;

    try {
      console.log('[TopicsContext] Deleting topic:', topicId);
      const batch = writeBatch(db);
      
      // Delete associated notes
      const notesQuery = query(
        collection(db, 'notes'), 
        where('topicIds', 'array-contains', topicId)
      );
      const notesSnapshot = await getDocs(notesQuery);
      notesSnapshot.docs.forEach(noteDoc => {
        batch.delete(noteDoc.ref);
      });

      // Delete topic
      batch.delete(doc(db, 'topics', topicId));
      await batch.commit();
      return true;
    } catch (err) {
      console.error('[TopicsContext] Delete topic failed:', err);
      return false;
    }
  }, [user?.uid]);

  // Toggle archive topic - Updated to modify the topic document directly
  const toggleArchiveTopic = useCallback(async (topicId: string) => {
    if (!user?.uid) return false;

    try {
      console.log('[TopicsContext] Toggling archive status for topic:', topicId);
      
      // First get the current topic to check its archive status
      const topicRef = doc(db, 'topics', topicId);
      const topicSnap = await getDoc(topicRef);
      
      if (topicSnap.exists()) {
        const topicData = topicSnap.data();
        // Toggle the archived status
        const newArchiveStatus = !topicData.archived;
        
        await updateDoc(topicRef, {
          archived: newArchiveStatus,
          updatedAt: serverTimestamp()
        });
        
        console.log(`[TopicsContext] Topic ${topicId} archive status toggled to ${newArchiveStatus}`);
        return true;
      } else {
        console.error('[TopicsContext] Topic not found:', topicId);
        return false;
      }
    } catch (err) {
      console.error('[TopicsContext] Toggle archive failed:', err);
      return false;
    }
  }, [user?.uid]);

  // Toggle bookmark
  const toggleBookmark = useCallback(async (topicId: string) => {
    if (!user?.uid) return false;

    try {
      console.log('[TopicsContext] Toggling topic bookmark:', topicId);
      const userRef = doc(db, 'users', user.uid);
      const isBookmarked = userProfile?.bookmarkedTopics?.includes(topicId);
      
      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarkedTopics: arrayRemove(topicId)
        });
      } else {
        await updateDoc(userRef, {
          bookmarkedTopics: arrayUnion(topicId)
        });
      }
      
      return true;
    } catch (err) {
      console.error('[TopicsContext] Toggle bookmark failed:', err);
      return false;
    }
  }, [user?.uid, userProfile?.bookmarkedTopics]);

  // Main topics listener
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setActiveTopics([]);
      setArchivedTopics([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const topicsQuery = query(
        collection(db, 'topics'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        topicsQuery,
        (snapshot) => {
          const allTopics = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || `Topic ${doc.id.substring(0, 5)}`,
              userId: data.userId,
              content: data.content,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              archived: data.archived || false // Use the direct archived property
            };
          });

          // Separate active and archived topics based on the archived property
          const active = allTopics.filter(topic => !topic.archived);
          const archived = allTopics.filter(topic => topic.archived);

          console.log(`[TopicsContext] Loaded ${active.length} active topics and ${archived.length} archived topics`);
          
          setActiveTopics(active);
          setArchivedTopics(archived);
          setLoading(false);
        },
        (err) => {
          console.error('[TopicsContext] Topics listener error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      topicsUnsubscribeRef.current = unsubscribe;
      
      return () => {
        if (topicsUnsubscribeRef.current) {
          topicsUnsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error('[TopicsContext] Topics fetch error:', err);
      setError('Failed to fetch topics');
      setLoading(false);
    }
  }, [user?.uid, authLoading]);

  // Bookmarked topics fetcher
  useEffect(() => {
    if (authLoading || !user?.uid) {
      setBookmarkedTopics([]);
      return;
    }
    
    const fetchBookmarked = async () => {
      if (!userProfile?.bookmarkedTopics?.length) {
        setBookmarkedTopics([]);
        return;
      }

      try {
        const bookmarks = await Promise.all(
          userProfile.bookmarkedTopics.map(async (topicId) => {
            const topicDoc = await getDoc(doc(db, 'topics', topicId));
            if (!topicDoc.exists()) return null;

            const data = topicDoc.data();
            let ownerName = 'Unknown';
            
            if (data.userId) {
              const ownerDoc = await getDoc(doc(db, 'users', data.userId));
              ownerName = ownerDoc.exists() ? ownerDoc.data().displayName : 'Unknown';
            }

            return {
              id: topicDoc.id,
              name: data.name || `Topic ${topicDoc.id.substring(0, 5)}`,
              ...data,
              ownerName
            };
          })
        );

        const validBookmarks = bookmarks.filter(Boolean) as Topic[];
        setBookmarkedTopics(validBookmarks);
      } catch (err) {
        console.error('[TopicsContext] Bookmarks fetch failed:', err);
        setBookmarkedTopics([]);
      }
    };

    fetchBookmarked();
  }, [user?.uid, userProfile?.bookmarkedTopics, authLoading]);

  // Expose the context value
  const contextValue = {
    activeTopics,
    archivedTopics,
    bookmarkedTopics,
    topics: activeTopics,
    loading,
    error,
    addTopic,
    deleteTopic,
    toggleArchiveTopic,
    toggleBookmark
  };

  return (
    <TopicsContext.Provider value={contextValue}>
      {children}
    </TopicsContext.Provider>
  );
}

export const useTopics = () => {
  const context = useContext(TopicsContext);
  if (!context) throw new Error('useTopics must be used within TopicsProvider');
  return context;
};