'use client'

import { useState, useEffect } from 'react'
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

// Import components
import RepliesPanel from '@/components/RepliesPanel'
import TopicContent from '@/components/TopicContent'

// Background color component to apply color to body - copied from page.tsx
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

// Custom ProfileCard component for the top of the navigation
function ProfileNavCard({ profile, onClick }) {
  return (
    <div className="profile-nav-card" onClick={onClick}>
      <div className="profile-pic-wrapper">
        {profile?.profilePic ? (
          <img 
            src={profile.profilePic} 
            alt="Profile" 
            className="profile-pic"
          />
        ) : (
          <div className="profile-pic-placeholder">
            {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>
      <div className="profile-info">
        <h3 className="profile-name">{profile?.displayName || 'User'}</h3>
        <p className="profile-bio-preview">{profile?.bio?.substring(0, 60) || 'No bio yet'}</p>
      </div>
    </div>
  );
}

export default function UserProfileView({ username }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [viewedProfile, setViewedProfile] = useState(null)
  const [viewedUserId, setViewedUserId] = useState(null)
  const [topics, setTopics] = useState([])
  const [activeSection, setActiveSection] = useState('user')
  const [activeNote, setActiveNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [bookmarkedTopics, setBookmarkedTopics] = useState([])
  const [userNotes, setUserNotes] = useState([])
  const [topicsLoading, setTopicsLoading] = useState(true)

  // Auth effect - check if current user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setCurrentUser(authUser)
      } else {
        router.push('/signin')
      }
    })
    
    return () => unsubscribe()
  }, [router])

  // Navigate back to user's profile
  const navigateToMyProfile = () => {
    router.push('/profile')
  }

  // Effect to fetch the viewed user's profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username || !currentUser) return
      
      try {
        setLoading(true)
        console.log("Finding user by username:", username);
        
        // First find the user by displayName (username)
        const usersQuery = query(
          collection(db, 'users'), 
          where('displayName', '==', username)
        )
        
        const usersSnapshot = await getDocs(usersQuery)
        
        if (usersSnapshot.empty) {
          console.log("No user found with username:", username);
          setNotFound(true)
          setLoading(false)
          return
        }
        
        // Get the first matching user
        const userDoc = usersSnapshot.docs[0]
        const userId = userDoc.id
        const userData = userDoc.data()
        
        console.log("Found user with ID:", userId);
        setViewedUserId(userId)
        setViewedProfile(userData)
        
        // Fetch the user's topics
        setTopicsLoading(true)
        const topicsQuery = query(
          collection(db, 'topics'), 
          where('userId', '==', userId)
        )
        
        const topicsSnapshot = await getDocs(topicsQuery)
        const topicsList = topicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Hide archived topics for public view
        const publicTopics = topicsList.filter(topic => !topic.archived)
        setTopics(publicTopics)
        setTopicsLoading(false)
        
        // Fetch the user's notes
        const notesQuery = query(
          collection(db, 'notes'),
          where('authorId', '==', userId)
        )
        
        const notesSnapshot = await getDocs(notesQuery)
        const notesList = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setUserNotes(notesList)
        
        // Check which topics the current user has bookmarked
        const currentUserDocRef = doc(db, 'users', currentUser.uid)
        const currentUserDoc = await getDoc(currentUserDocRef)
        
        if (currentUserDoc.exists()) {
          const currentUserData = currentUserDoc.data()
          const bookmarkedIds = currentUserData.bookmarkedTopics || []
          
          // Create a list of bookmarked topics with owner names
          const bookmarks = []
          for (const topicId of bookmarkedIds) {
            // Only include if the topic belongs to the viewed user
            const matchingTopic = publicTopics.find(t => t.id === topicId)
            if (matchingTopic) {
              bookmarks.push({
                ...matchingTopic,
                ownerName: userData.displayName || 'Unknown'
              })
            }
          }
          
          setBookmarkedTopics(bookmarks)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (username && currentUser) {
      fetchUserProfile()
    }
  }, [username, currentUser])

  // Add reply to note function
  const addReplyToNote = async (noteId, replyContent) => {
    if (!replyContent.trim() || !currentUser || replyContent.length > 280 || !noteId) return
  
    try {
      // Get current user's profile info
      const userDocRef = doc(db, 'users', currentUser.uid)
      const userDoc = await getDoc(userDocRef)
      const userData = userDoc.exists() ? userDoc.data() : {}
      
      const reply = {
        content: replyContent.trim(),
        timestamp: new Date().toISOString(),
        author: userData.displayName || currentUser.email.split('@')[0],
        profilePic: userData.profilePic || null
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
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile for {username}...</p>
      </div>
    )
  }
  
  if (notFound) {
    return (
      <div className="not-found-container">
        <h2>User Not Found</h2>
        <p>The user "{username}" doesn't exist or has been removed.</p>
        <button onClick={navigateToMyProfile} className="primary-button">
          Back to My Profile
        </button>
      </div>
    )
  }

  // Determine which view to show based on active section
  const renderContent = () => {
    if (activeSection === 'user' || activeSection === `user-profile-${viewedUserId}`) {
      // User Notes View
      return (
        <div className="notes-section">
          {/* User Banner */}
          {viewedProfile?.bannerImage && (
            <div className="user-banner">
              <img
                src={viewedProfile.bannerImage}
                alt="Profile banner"
                className="banner-image"
              />
            </div>
          )}
          
          {/* User Profile Info */}
          <div className="user-profile-header">
            <div className="profile-pic-container">
              {viewedProfile?.profilePic ? (
                <img
                  src={viewedProfile.profilePic}
                  alt="Profile"
                  className="profile-pic-large"
                />
              ) : (
                <div className="profile-pic-placeholder-large">
                  {viewedProfile?.displayName ? viewedProfile.displayName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="profile-info-container">
              <h2 className="profile-name-large">{viewedProfile?.displayName || 'User'}</h2>
              <p className="profile-bio">{viewedProfile?.bio || 'No bio yet.'}</p>
            </div>
          </div>
          
          {/* User's Notes */}
          <div className="notes-container">
            <div className="notes-header">
              <h3>Notes</h3>
            </div>
            
            {userNotes.length > 0 ? (
              <div className="notes-list">
                {userNotes
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((note) => (
                    <div 
                      key={note.id} 
                      className={`note-item ${activeNote === note.id ? 'note-active' : ''}`}
                      onClick={() => setActiveNote(note.id)}
                    >
                      <div className="note-container">
                        <div className="note-avatar">
                          {viewedProfile?.profilePic ? (
                            <img 
                              src={viewedProfile.profilePic} 
                              alt={`${viewedProfile.displayName}'s avatar`}
                              className="avatar-image"
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              {viewedProfile?.displayName ? viewedProfile.displayName.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                        </div>
                        <div className="note-content-wrapper">
                          <div className="note-header">
                            <span className="note-author">{viewedProfile?.displayName || 'User'}</span>
                            <span className="note-date">{new Date(note.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="note-content">{note.content}</p>
                          
                          {/* Show topic tag if note has a topic */}
                          {note.topicId && (
                            <div 
                              className="note-topic-tag"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSection(`topic-${note.topicId}`);
                              }}
                            >
                              Topic: {topics.find(t => t.id === note.topicId)?.name || 'Unknown'}
                            </div>
                          )}
                          
                          {note.replies && note.replies.length > 0 && (
                            <div className="note-replies-count">
                              {note.replies.length} {note.replies.length === 1 ? 'reply' : 'replies'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="empty-state">No notes yet.</p>
            )}
          </div>
        </div>
      )
    } else if (activeSection.startsWith('topic-')) {
      // Topic Content View
      return (
        <TopicContent 
          topicId={activeSection.replace('topic-', '')} 
          userId={currentUser?.uid}
          onTopicDeleted={null} // No delete option in public view
        />
      )
    } else {
      // Default view
      return (
        <div className="home-page-container">
          <h2>Welcome to {viewedProfile?.displayName}'s Profile</h2>
          <p>Browse their notes and topics using the navigation panel.</p>
        </div>
      )
    }
  }

  return (
    <div className="profile-container">
      {/* Apply background color to the entire page */}
      <PageBackground backgroundColor={viewedProfile?.backgroundColor || '#f8f8f8'} />
      
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="site-title">interestingto.me</h1>
          <button 
            onClick={navigateToMyProfile} 
            className="back-button"
            style={{
              padding: '8px 12px',
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem',
              color: '#4b5563'
            }}
          >
            Back to My Profile
          </button>
        </div>
      </header>
      
      {/* Three-column layout */}
      <div className="three-column-layout">
        {/* Left column - Custom Navigation Panel */}
        <div className="left-column">
          <div className="nav-panel">
            <div className="nav-scroll-area">
              {/* Back to my notes button */}
              <div className="nav-container">
                <button 
                  className="back-to-my-notes-button"
                  onClick={navigateToMyProfile}
                >
                  ← Back to my notes
                </button>
                
                <div className="viewed-user-info">
                  <h3>Viewing: {viewedProfile?.displayName || 'User'}</h3>
                </div>
              </div>
              
              {/* Profile Card */}
              <div className="nav-container">
                <ProfileNavCard 
                  profile={viewedProfile} 
                  onClick={() => setActiveSection('user')}
                />
              </div>
              
              {/* Divider */}
              <div className="nav-divider"></div>
              
              {/* Topics Section */}
              <div className="nav-title">
                Topics
              </div>
              <div className="nav-container">
                {topicsLoading ? (
                  <p className="loading-text">Loading topics...</p>
                ) : (
                  <ul className="nav-list">
                    {topics.map((topic) => (
                      <li 
                        key={topic.id}
                        className={`nav-item ${activeSection === `topic-${topic.id}` ? 'nav-item-active' : ''}`}
                        onClick={() => setActiveSection(`topic-${topic.id}`)}
                      >
                        <span>{topic.name}</span>
                      </li>
                    ))}
                    {topics.length === 0 && (
                      <li className="nav-item-empty">No topics yet</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle column - Content */}
        <div className="middle-column">
          {renderContent()}
        </div>
        
        {/* Right column - Replies Panel */}
        <div className="right-column">
          <RepliesPanel 
            notes={userNotes}
            activeNoteId={activeNote}
            onAddReply={addReplyToNote}
            onClose={() => setActiveNote(null)}
            displayName={currentUser?.displayName}
            profilePic={currentUser?.profilePic}
          />
        </div>
      </div>
    </div>
  )
}