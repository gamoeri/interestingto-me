// src/context/TopicsContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  collection, addDoc, deleteDoc, doc, updateDoc,
  query, where, getDoc, getDocs, arrayUnion,
  arrayRemove, onSnapshot, serverTimestamp, writeBatch,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Topic {
  id: string;
  name: string; // This is used as title in the UI
  title?: string; // For backward compatibility
  userId: string;
  createdAt: any;
  updatedAt?: any;
  content?: string;
}

interface TopicsContextType {
  activeTopics: Topic[];
  archivedTopics: Topic[];
  bookmarkedTopics: Topic[];
  topics: Topic[]; // Combined active topics for backward compatibility
  loading: boolean;
  error: string | null;
  addTopic: (name: string) => Promise<Topic | null>;
  deleteTopic: (topicId: string) => Promise<boolean>;
  toggleArchiveTopic: (topicId: string, shouldArchive: boolean) => Promise<boolean>;
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
  const [indexError, setIndexError] = useState(false);
  const topicsUnsubscribeRef = useRef<(() => void) | null>(null);

  console.log('[TopicsContext] Provider initializing', {
    user: user?.uid,
    authLoading
  });

  // Check if auth is ready
  const isAuthReady = !!user && !!userProfile;

  // Main topics listener
  useEffect(() => {
    if (authLoading) {
      console.log('[TopicsContext] Auth still loading, skipping topics fetch');
      return;
    }

    if (!user?.uid) {
      console.log('[TopicsContext] No user UID, clearing topics');
      setActiveTopics([]);
      setArchivedTopics([]);
      setLoading(false);
      return;
    }

    console.log('[TopicsContext] User authenticated, setting up topics query');
    setLoading(true);

    try {
      const topicsQuery = indexError 
        ? query(collection(db, 'topics'), where('userId', '==', user.uid))
        : query(
            collection(db, 'topics'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

      console.log('[TopicsContext] Query setup complete', {
        usingSimpleQuery: indexError
      });

      const unsubscribe = onSnapshot(
        topicsQuery,
        (snapshot) => {
          console.log('[TopicsContext] Received topics snapshot', {
            count: snapshot.docs.length
          });

          try {
            const allTopics = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || `Topic ${doc.id.substring(0, 5)}`,
                title: data.name || `Topic ${doc.id.substring(0, 5)}`, // For backward compatibility
                userId: data.userId,
                content: data.content,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              };
            });

            if (indexError) {
              allTopics.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date();
                const dateB = b.createdAt?.toDate?.() || new Date();
                return dateB.getTime() - dateA.getTime();
              });
            }

            const archivedIds = userProfile?.archivedTopics || [];
            const active = allTopics.filter(topic => !archivedIds.includes(topic.id));
            const archived = allTopics.filter(topic => archivedIds.includes(topic.id));

            console.log('[TopicsContext] Processed topics', {
              activeCount: active.length,
              archivedCount: archived.length
            });

            setActiveTopics(active);
            setArchivedTopics(archived);
            setLoading(false);
          } catch (err) {
            console.error('[TopicsContext] Error processing topics:', err);
            setError('Failed to process topics');
            setLoading(false);
          }
        },
        (err) => {
          console.error('[TopicsContext] Topics listener error:', err);
          if (err.message && err.message.includes('requires an index')) {
            console.log('[TopicsContext] Retrying with simple query');
            setIndexError(true);
          }
          setError(err.message);
          setLoading(false);
        }
      );

      topicsUnsubscribeRef.current = unsubscribe;
      
      return () => {
        console.log('[TopicsContext] Cleaning up topics listener');
        if (topicsUnsubscribeRef.current) {
          topicsUnsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error('[TopicsContext] Topics fetch error:', err);
      setError('Failed to fetch topics');
      setLoading(false);
    }
  }, [user?.uid, userProfile, authLoading, indexError]);

  // Bookmarked topics fetcher
  useEffect(() => {
    if (authLoading) return;
    
    if (!user?.uid) {
      setBookmarkedTopics([]);
      return;
    }
    
    const fetchBookmarked = async () => {
      if (!isAuthReady || !userProfile?.bookmarkedTopics?.length) {
        setBookmarkedTopics([]);
        return;
      }

      try {
        console.log('[TopicsContext] Fetching bookmarked topics');
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
              title: data.name || `Topic ${topicDoc.id.substring(0, 5)}`, // For backward compatibility
              ...data,
              ownerName
            };
          })
        );

        const validBookmarks = bookmarks.filter(Boolean) as Topic[];
        console.log('[TopicsContext] Fetched bookmarked topics:', validBookmarks.length);
        setBookmarkedTopics(validBookmarks);
      } catch (err) {
        console.error('[TopicsContext] Bookmarks fetch failed:', err);
        setBookmarkedTopics([]);
      }
    };

    fetchBookmarked();
  }, [user?.uid, userProfile?.bookmarkedTopics, isAuthReady, authLoading]);

  // Add topic
  const addTopic = useCallback(async (name: string) => {
    if (!isAuthReady || !name.trim()) return null;

    try {
      console.log('[TopicsContext] Adding new topic:', name);
      const docRef = await addDoc(collection(db, 'topics'), {
        name: name.trim(),
        userId: user!.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        archived: false
      });
      
      return { 
        id: docRef.id, 
        name: name.trim(),
        title: name.trim(),
        userId: user!.uid,
        createdAt: new Date()
      };
    } catch (err) {
      console.error('[TopicsContext] Add topic failed:', err);
      return null;
    }
  }, [user?.uid, isAuthReady]);

  // Delete topic
  const deleteTopic = useCallback(async (topicId: string) => {
    if (!isAuthReady) return false;

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
  }, [user?.uid, isAuthReady]);

  // Toggle archive topic
  const toggleArchiveTopic = useCallback(async (topicId: string, shouldArchive: boolean) => {
    if (!isAuthReady) return false;

    try {
      console.log('[TopicsContext] Toggling topic archive status:', { topicId, shouldArchive });
      const userRef = doc(db, 'users', user!.uid);
      
      if (shouldArchive) {
        await updateDoc(userRef, {
          archivedTopics: arrayUnion(topicId)
        });
      } else {
        await updateDoc(userRef, {
          archivedTopics: arrayRemove(topicId)
        });
      }
      
      return true;
    } catch (err) {
      console.error('[TopicsContext] Toggle archive failed:', err);
      return false;
    }
  }, [user?.uid, isAuthReady]);

  // Toggle bookmark
  const toggleBookmark = useCallback(async (topicId: string) => {
    if (!isAuthReady) return false;

    try {
      console.log('[TopicsContext] Toggling topic bookmark:', topicId);
      const userRef = doc(db, 'users', user!.uid);
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
  }, [user?.uid, userProfile?.bookmarkedTopics, isAuthReady]);

  // We provide both activeTopics and a combined topics array for backward compatibility
  const contextValue = {
    activeTopics,
    archivedTopics,
    bookmarkedTopics,
    topics: activeTopics, // For backward compatibility
    loading,
    error,
    addTopic,
    deleteTopic,
    toggleArchiveTopic,
    toggleBookmark
  };

  console.log('[TopicsContext] Providing context', {
    activeTopics: activeTopics.length,
    archivedTopics: archivedTopics.length,
    bookmarkedTopics: bookmarkedTopics.length,
    loading,
    hasError: !!error
  });

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