'use client'

import { useState, useEffect, useCallback } from 'react'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'

// Import components
import NavPanel from '@/components/NavPanel'
import NotesSection from '@/components/NotesSection'
import RepliesPanel from '@/components/RepliesPanel'
import TopicContent from '@/components/TopicContent'
import ProfileEdit from '@/components/ProfileEdit'
import HomePage from '@/components/HomePage' // You'll need to create this
import SearchPage from '@/components/SearchPage' // You'll need to create this

import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/navpanel.css'
import '@/styles/notes.css'
import '@/styles/topics.css'
import '@/styles/search.css'
import '@/styles/profile.css'
import '@/styles/ui.css'

// Background color component to apply color to body
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

// Main Profile Component
export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState([])
  const [archivedTopics, setArchivedTopics] = useState([]) // New state for archived topics
  const [activeSection, setActiveSection] = useState('home') // Changed default to 'home'
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [activeNote, setActiveNote] = useState(null)
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
            const newProfile = {
              email: authUser.email,
              displayName: authUser.email.split('@')[0],
              bio: '',
              profilePic: '',
              bannerImage: '', // Initialize banner image
              backgroundColor: '#f8f8f8', // Initialize background color
              createdAt: new Date().toISOString(),
              bookmarkedTopics: [], // Initialize bookmarked topics array
              archivedTopics: [] // Initialize archived topics array
            }
            await setDoc(userDocRef, newProfile)
            setUserProfile(newProfile)
          } else {
            const userData = userDoc.data()
            // Check if required fields exist, if not add them
            let updatedFields = {}
            let updatedUserData = {...userData}
            
            if (!userData.bookmarkedTopics) {
              updatedFields.bookmarkedTopics = []
              updatedUserData.bookmarkedTopics = []
            }
            
            if (!userData.archivedTopics) {
              updatedFields.archivedTopics = []
              updatedUserData.archivedTopics = []
            }

            // Check for new fields we're adding
            if (!userData.bannerImage) {
              updatedFields.bannerImage = ''
              updatedUserData.bannerImage = ''
            }

            if (!userData.backgroundColor) {
              updatedFields.backgroundColor = '#f8f8f8'
              updatedUserData.backgroundColor = '#f8f8f8'
            }
            
            if (Object.keys(updatedFields).length > 0) {
              await updateDoc(userDocRef, updatedFields)
            }
            
            setUserProfile(updatedUserData)
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

  // Fetch topics when user changes
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

  // Fetch user's notes when user changes
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
  
  useEffect(() => {
    const fetchBookmarkedTopics = async () => {
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
    }
    
    fetchBookmarkedTopics()
  }, [userProfile?.bookmarkedTopics])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [router])

  const updateDisplayName = useCallback(async (newName) => {
    if (!user || !newName.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { displayName: newName })
      setUserProfile(prev => ({...prev, displayName: newName}))
    } catch (error) {
      console.error('Error updating name:', error)
      alert('Failed to update name. Please try again.')
    }
  }, [user])

  const updateBio = useCallback(async (newBio) => {
    if (!user) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { bio: newBio })
      setUserProfile(prev => ({...prev, bio: newBio}))
    } catch (error) {
      console.error('Error updating bio:', error)
      alert('Failed to update bio. Please try again.')
    }
  }, [user])

  const updateProfilePic = useCallback(async (newPic) => {
    if (!user || !newPic.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { profilePic: newPic })
      setUserProfile(prev => ({...prev, profilePic: newPic}))
    } catch (error) {
      console.error('Error updating profile picture:', error)
      alert('Failed to update profile picture. Please try again.')
    }
  }, [user])

  // New function for banner image
  const updateBannerImage = useCallback(async (newBanner) => {
    if (!user || !newBanner.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { bannerImage: newBanner })
      setUserProfile(prev => ({...prev, bannerImage: newBanner}))
    } catch (error) {
      console.error('Error updating banner image:', error)
      alert('Failed to update banner image. Please try again.')
    }
  }, [user])

  // New function for background color
  const updateBackgroundColor = useCallback(async (newColor) => {
    if (!user || !newColor.trim()) return
    
    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, { backgroundColor: newColor })
      setUserProfile(prev => ({...prev, backgroundColor: newColor}))
    } catch (error) {
      console.error('Error updating background color:', error)
      alert('Failed to update background color. Please try again.')
    }
  }, [user])

  // New function to archive a topic
  const handleArchiveTopic = useCallback(async (topicId) => {
    if (!user || !topicId) return
    
    try {
      // Update user's archivedTopics array
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        archivedTopics: arrayUnion(topicId)
      })
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        archivedTopics: [...(prev.archivedTopics || []), topicId]
      }))
      
      // Move topic from active to archived in local state
      const topicToArchive = topics.find(t => t.id === topicId)
      if (topicToArchive) {
        setTopics(prev => prev.filter(t => t.id !== topicId))
        setArchivedTopics(prev => [...prev, topicToArchive])
      }
      
      // If the archived topic was the active section, switch to the home section
      if (activeSection === `topic-${topicId}`) {
        setActiveSection('home')
      }
    } catch (error) {
      console.error('Error archiving topic:', error)
      alert('Failed to archive topic. Please try again.')
    }
  }, [user, topics, activeSection])

  // New function to unarchive a topic
  const handleUnarchiveTopic = useCallback(async (topicId) => {
    if (!user || !topicId) return
    
    try {
      // Update user's archivedTopics array
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        archivedTopics: arrayRemove(topicId)
      })
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        archivedTopics: (prev.archivedTopics || []).filter(id => id !== topicId)
      }))
      
      // Move topic from archived to active in local state
      const topicToUnarchive = archivedTopics.find(t => t.id === topicId)
      if (topicToUnarchive) {
        setArchivedTopics(prev => prev.filter(t => t.id !== topicId))
        setTopics(prev => [...prev, topicToUnarchive])
      }
    } catch (error) {
      console.error('Error unarchiving topic:', error)
      alert('Failed to unarchive topic. Please try again.')
    }
  }, [user, archivedTopics])

  // Updated to use the notes collection
  const addNote = useCallback(async (noteContent, selectedTopicId = null) => {
    if (!noteContent.trim() || !user || noteContent.length > 280) return
  
    try {
      // Create a new document in the notes collection
      const noteData = {
        content: noteContent.trim(),
        timestamp: new Date().toISOString(),
        author: userProfile?.displayName || user.email.split('@')[0],
        authorId: user.uid,
        profilePic: userProfile?.profilePic || null,
        replies: [],
        topicId: selectedTopicId
      }
      
      // Add to the notes collection
      const noteRef = await addDoc(collection(db, 'notes'), noteData)
      
      // Add the new note to the local state
      const newNote = {
        id: noteRef.id,
        ...noteData
      }
      
      setUserNotes(prev => [newNote, ...prev])
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    }
  }, [user, userProfile])
  
  // Updated to use the notes collection
  const deleteNote = useCallback(async (noteId) => {
    if (!user || !noteId) return
    
    try {
      // Delete the note document
      await deleteDoc(doc(db, 'notes', noteId))
      
      // Update the local state
      setUserNotes(prev => prev.filter(note => note.id !== noteId))
      
      // If this was the active note, clear the selection
      if (activeNote === noteId) {
        setActiveNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note. Please try again.')
    }
  }, [user, activeNote])

  // Updated to use the notes collection
  const addReplyToNote = useCallback(async (noteId, replyContent, userInfo = null) => {
    if (!replyContent.trim() || !user || replyContent.length > 280 || !noteId) return
  
    try {
      // Use provided userInfo or fallback to current profile data
      const authorName = userInfo?.displayName || userProfile?.displayName || user.email.split('@')[0];
      const authorPic = userInfo?.profilePic || userProfile?.profilePic || null;
      
      const reply = {
        content: replyContent.trim(),
        timestamp: new Date().toISOString(),
        author: authorName,
        profilePic: authorPic
      }
      
      // Reference to the note document
      const noteRef = doc(db, 'notes', noteId)
      
      // Update the note with the new reply
      await updateDoc(noteRef, {
        replies: arrayUnion(reply)
      })
      
      // Update local state
      setUserNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          return {
            ...note,
            replies: [...(note.replies || []), reply]
          }
        }
        return note
      }))
    } catch (error) {
      console.error('Error adding reply:', error)
      alert('Failed to add reply. Please try again.')
    }
  }, [user, userProfile])

  const handleDeleteTopic = useCallback(async (topicId) => {
    if (!topicId || !user) return
    
    try {
      // Delete the topic from Firestore
      await deleteDoc(doc(db, 'topics', topicId))
      
      // Update the local state
      setTopics(prev => prev.filter(topic => topic.id !== topicId))
      setArchivedTopics(prev => prev.filter(topic => topic.id !== topicId))
      
      // Also remove from archived topics in user profile if it was there
      if (userProfile?.archivedTopics?.includes(topicId)) {
        const userDocRef = doc(db, 'users', user.uid)
        await updateDoc(userDocRef, {
          archivedTopics: arrayRemove(topicId)
        })
        
        setUserProfile(prev => ({
          ...prev,
          archivedTopics: prev.archivedTopics.filter(id => id !== topicId)
        }))
      }
      
      // If the deleted topic was the active section, switch to the home section
      if (activeSection === `topic-${topicId}`) {
        setActiveSection('home')
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
      alert('Failed to delete topic. Please try again.')
    }
  }, [user, activeSection, userProfile])

  const handleAddTopic = useCallback(async (topicName) => {
    if (!topicName.trim() || !user) return
    
    try {
      const newTopic = {
        name: topicName.trim(),
        userId: user.uid,
        createdAt: new Date().toISOString(),
      }
      
      const docRef = await addDoc(collection(db, 'topics'), newTopic)
      setTopics(prev => [...prev, { id: docRef.id, ...newTopic }])
    } catch (error) {
      console.error('Error adding topic:', error)
      alert('Failed to add topic. Please try again.')
    }
  }, [user])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-container">
      {/* Apply background color to the entire page */}
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
            topics={activeSection.startsWith('user-profile-') ? [] : topics}
            archivedTopics={archivedTopics}
            bookmarkedTopics={bookmarkedTopics}
            topicsLoading={topicsLoading}
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onAddTopic={handleAddTopic}
            onDeleteTopic={handleDeleteTopic}
            onArchiveTopic={handleArchiveTopic}
            onUnarchiveTopic={handleUnarchiveTopic}
            onSignOut={handleSignOut}
            isViewingOtherUser={activeSection.startsWith('user-profile-')}
            viewedUserName={activeSection.startsWith('user-profile-') ? 
              // This is where you would get the viewed user's name
              "Other User" : ""}
          />
        </div>
        
        {/* Middle column - Content */}
        <div className="middle-column">
          {activeSection === 'edit-profile' ? (
            /* Profile Edit View */
            <ProfileEdit 
              userProfile={userProfile}
              onUpdateDisplayName={updateDisplayName}
              onUpdateBio={updateBio}
              onUpdateProfilePic={updateProfilePic}
              onUpdateBannerImage={updateBannerImage}
              onUpdateBackgroundColor={updateBackgroundColor}
              onClose={() => setActiveSection('home')}
            />
          ) : activeSection === 'home' ? (
            /* Home Page View */
            <HomePage 
              user={user}
              userProfile={userProfile}
              bookmarkedTopics={bookmarkedTopics}
              onSelectNote={setActiveNote}
              onSelectTopic={(topicId) => setActiveSection(`topic-${topicId}`)}
              activeNoteId={activeNote}
            />
          ) : activeSection === 'search' ? (
            /* Search Page View */
            <SearchPage 
              user={user}
              userProfile={userProfile}
              onSelectNote={setActiveNote}
              onSelectTopic={(topicId) => setActiveSection(`topic-${topicId}`)}
              onSelectUser={(userId) => {
                // Handle user selection here
                // You'll need to create a UserProfile component or redirect to user profile
                console.log(`Viewing user profile: ${userId}`);
                // For now, you can set it to a new 'user-profile' section with the user ID
                setActiveSection(`user-profile-${userId}`);
              }}
            />
          ) : activeSection.startsWith('user-profile-') ? (
            /* User Profile View - This is a new section to add */
            <UserProfileView
              userId={activeSection.replace('user-profile-', '')}
              currentUser={user}
            />
          ) : activeSection === 'user' ? (
            /* User Profile View */
            <NotesSection 
              notes={userNotes}
              topics={topics}
              userProfile={userProfile}
              onAddNote={addNote}
              onDeleteNote={deleteNote}
              onSelectNote={setActiveNote}
              activeNoteId={activeNote}
              displayName={userProfile?.displayName}
              profilePic={userProfile?.profilePic}
              onUpdateDisplayName={updateDisplayName}
              onUpdateBio={updateBio}
              onUpdateProfilePic={updateProfilePic}
              onUpdateBannerImage={updateBannerImage}
              onUpdateBackgroundColor={updateBackgroundColor}
              bannerImage={userProfile?.bannerImage}
            />
          ) : (
            /* Topic Content View */
            <TopicContent 
              topicId={activeSection.replace('topic-', '')} 
              userId={user?.uid}
              onTopicDeleted={handleDeleteTopic}
            />
          )}
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
  )
}