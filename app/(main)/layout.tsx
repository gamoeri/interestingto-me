'use client'

import React from 'react'
import { useState, useEffect, useCallback, createContext } from 'react'
import { auth, db } from '@/lib/firebase'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'

// Import components
import NavPanel from '@/components/NavPanel'
import RepliesPanel from '@/components/RepliesPanel'

// Import CSS files
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/navpanel.css'
import '@/styles/notes.css'
import '@/styles/topics.css'
import '@/styles/bookmarks.css'
import '@/styles/profile.css'
import '@/styles/ui.css'

// Create a context to share state with child components
export const AppContext = createContext({
  user: null,
  userProfile: null,
  userNotes: [],
  topics: [],
  archivedTopics: [],
  bookmarkedTopics: [],
  activeNote: null,
  setActiveNote: (noteId) => {},
  addReplyToNote: async (noteId, replyContent) => {},
  handleSignOut: async () => {},
  toggleBookmark: async (topicId) => {}
})

// Background color component
function PageBackground({ backgroundColor = '#f8f8f8' }) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = backgroundColor;
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = '';
      }
    };
  }, [backgroundColor]);
  
  return null;
}

export default function MainLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState([])
  const [archivedTopics, setArchivedTopics] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [bookmarkedTopics, setBookmarkedTopics] = useState([])
  const [userNotes, setUserNotes] = useState([])

  // Auth effect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser)
        
        try {
          // Get user profile
          const userDocRef = doc(db, 'users', authUser.uid)
          const userDoc = await getDoc(userDocRef)
          
          if (!userDoc.exists()) {
            router.push('/signin')
            return
          } else {
            const userData = userDoc.data()
            setUserProfile(userData)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      } else {
        router.push('/signin')
        return
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      if (!user || !userProfile) return
      
      try {
        setTopicsLoading(true)
        
        // Get all user's topics
        const topicsQuery = query(collection(db, 'topics'), where('userId', '==', user.uid))
        const topicsSnapshot = await getDocs(topicsQuery)
        const allTopics = topicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Filter out archived topics
        const archivedIds = userProfile.archivedTopics || []
        const activeTopics = allTopics.filter(topic => !archivedIds.includes(topic.id))
        const archiveTopics = allTopics.filter(topic => archivedIds.includes(topic.id))
        
        setTopics(activeTopics)
        setArchivedTopics(archiveTopics)
      } catch (error) {
        console.error('Error fetching topics:', error)
      } finally {
        setTopicsLoading(false)
      }
    }

    fetchTopics()
  }, [user, userProfile])

  // Fetch user's notes
  useEffect(() => {
    const fetchUserNotes = async () => {
      if (!user) return
      
      try {
        const notesQuery = query(collection(db, 'notes'), where('authorId', '==', user.uid))
        const notesSnapshot = await getDocs(notesQuery)
        const notesList = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setUserNotes(notesList)
      } catch (error) {
        console.error('Error fetching user notes:', error)
      }
    }

    fetchUserNotes()
  }, [user])

  // Fetch bookmarked topics
  const fetchBookmarkedTopics = useCallback(async () => {
    if (!userProfile?.bookmarkedTopics || userProfile.bookmarkedTopics.length === 0) {
      setBookmarkedTopics([])
      return
    }
    
    try {
      const bookmarkedTopicsData = []
      
      // Fetch each bookmarked topic by ID
      for (const topicId of userProfile.bookmarkedTopics) {
        const topicDoc = await getDoc(doc(db, 'topics', topicId))
        if (topicDoc.exists()) {
          const topicData = topicDoc.data()
          
          // Also fetch the owner's name
          let ownerName = 'Unknown'
          if (topicData.userId) {
            const ownerDoc = await getDoc(doc(db, 'users', topicData.userId))
            if (ownerDoc.exists()) {
              ownerName = ownerDoc.data().displayName || 'Unknown'
            }
          }
          
          bookmarkedTopicsData.push({
            id: topicDoc.id,
            ...topicData,
            ownerName
          })
        }
      }
      
      setBookmarkedTopics(bookmarkedTopicsData)
    } catch (error) {
      console.error('Error fetching bookmarked topics:', error)
    }
  }, [userProfile?.bookmarkedTopics])
  
  // Call fetchBookmarkedTopics when userProfile changes
  useEffect(() => {
    fetchBookmarkedTopics()
  }, [userProfile?.bookmarkedTopics, fetchBookmarkedTopics])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [router])

  const addReplyToNote = useCallback(async (noteId, replyContent, currentUserInfo = {}) => {
    if (!replyContent.trim() || !user || replyContent.length > 280 || !noteId) return;
  
    try {
      // Create the reply object
      const reply = {
        content: replyContent.trim(),
        timestamp: new Date().toISOString(),
        author: userProfile?.displayName || user.email.split('@')[0],
        profilePic: userProfile?.profilePic || null,
        // Allow override with provided user info (for compatibility with existing code)
        ...currentUserInfo
      };
      
      // Update the note with the new reply
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        replies: arrayUnion(reply)
      });
      
      // Update local state
      setUserNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const currentReplies = note.replies || [];
          return {
            ...note,
            replies: [...currentReplies, reply]
          };
        }
        return note;
      }));
      
      return true;
    } catch (error) {
      console.error('Error adding reply:', error);
      return false;
    }
  }, [user, userProfile]);

  // Add toggle bookmark function
  const toggleBookmark = useCallback(async (topicId) => {
    if (!user || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentBookmarks = userProfile.bookmarkedTopics || [];
      
      // Check if already bookmarked
      const isCurrentlyBookmarked = currentBookmarks.includes(topicId);
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await updateDoc(userRef, {
          bookmarkedTopics: arrayRemove(topicId)
        });
        
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          bookmarkedTopics: prev.bookmarkedTopics.filter(id => id !== topicId)
        }));
        
        // Update bookmarked topics list
        setBookmarkedTopics(prev => prev.filter(topic => topic.id !== topicId));
      } else {
        // Add bookmark
        await updateDoc(userRef, {
          bookmarkedTopics: arrayUnion(topicId)
        });
        
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          bookmarkedTopics: [...(prev.bookmarkedTopics || []), topicId]
        }));
        
        // We'll need to fetch the topic data to add to bookmarked topics
        const topicDoc = await getDoc(doc(db, 'topics', topicId));
        if (topicDoc.exists()) {
          const topicData = topicDoc.data();
          
          // Fetch owner name
          let ownerName = 'Unknown';
          if (topicData.userId) {
            const ownerDoc = await getDoc(doc(db, 'users', topicData.userId));
            if (ownerDoc.exists()) {
              ownerName = ownerDoc.data().displayName || 'Unknown';
            }
          }
          
          // Add to bookmarked topics list
          setBookmarkedTopics(prev => [...prev, {
            id: topicId,
            ...topicData,
            ownerName
          }]);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark. Please try again.');
    }
  }, [user, userProfile]);

  // Create context value
  const contextValue = {
    user,
    userProfile,
    userNotes,
    topics,
    archivedTopics,
    bookmarkedTopics,
    activeNote,
    setActiveNote,
    addReplyToNote,
    handleSignOut,
    toggleBookmark
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="profile-container">
        {/* Apply background color */}
        <PageBackground backgroundColor={userProfile?.backgroundColor || '#f8f8f8'} />
        
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h1 className="site-title">interestingto.me</h1>
          </div>
        </header>
        
        {/* Three-column layout */}
        <div className="three-column-layout">
          {/* Left column - Navigation Panel */}
          <div className="left-column">
            <NavPanel 
              userProfile={userProfile}
              topics={topics}
              archivedTopics={archivedTopics}
              bookmarkedTopics={bookmarkedTopics}
              topicsLoading={topicsLoading}
              onSignOut={handleSignOut}
              currentPath={pathname}
            />
          </div>
          
          {/* Middle column - Content (children) */}
          <div className="middle-column">
            {children}
          </div>
          
          {/* Right column - Replies Panel */}
          <div className="right-column">
            <RepliesPanel 
              notes={userNotes}
              activeNoteId={activeNote}
              onAddReply={addReplyToNote}
              onClose={() => setActiveNote(null)}
              displayName={userProfile?.displayName}
              profilePic={userProfile?.profilePic}
            />
          </div>
        </div>
      </div>
    </AppContext.Provider>
  )
}