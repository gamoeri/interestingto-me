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
import TopicContent from '@/components/TopicContent'

export default function UserProfileView({ username }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [viewedProfile, setViewedProfile] = useState(null)
  const [viewedUserId, setViewedUserId] = useState(null)
  const [topics, setTopics] = useState([])
  const [activeSection, setActiveSection] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  // Effect to find user by username
  useEffect(() => {
    const findUserByUsername = async () => {
      if (!username) return
      
      try {
        setLoading(true)
        
        // Query to find user by displayName (username)
        const usersQuery = query(
          collection(db, 'users'), 
          where('displayName', '==', username)
        )
        
        const usersSnapshot = await getDocs(usersQuery)
        
        if (usersSnapshot.empty) {
          setNotFound(true)
          setLoading(false)
          return
        }
        
        // Get the first matching user
        const userDoc = usersSnapshot.docs[0]
        const userId = userDoc.id
        const userData = userDoc.data()
        
        setViewedUserId(userId)
        setViewedProfile(userData)
        
        // Now fetch the user's topics
        const topicsQuery = query(
          collection(db, 'topics'), 
          where('userId', '==', userId)
        )
        
        const topicsSnapshot = await getDocs(topicsQuery)
        const topicsList = topicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setTopics(topicsList)
      } catch (error) {
        console.error('Error finding user by username:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (username) {
      findUserByUsername()
    }
  }, [username])

  const handleBookmarkTopic = async (topicId) => {
    if (!currentUser || !topicId) return
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid)
      const userDoc = await getDoc(userDocRef)
      
      if (!userDoc.exists()) return
      
      const userData = userDoc.data()
      const isBookmarked = userData.bookmarkedTopics?.includes(topicId) || false
      
      if (isBookmarked) {
        // Remove bookmark
        await updateDoc(userDocRef, {
          bookmarkedTopics: arrayRemove(topicId)
        })
      } else {
        // Add bookmark
        await updateDoc(userDocRef, {
          bookmarkedTopics: arrayUnion(topicId)
        })
      }
      
      // We don't update local state here since this component doesn't track
      // which topics are bookmarked - that's handled in the TopicContent component
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      alert('Failed to update bookmark. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }
  
  if (notFound) {
    return (
      <div className="not-found-container">
        <h2>User Not Found</h2>
        <p>The user "{username}" doesn't exist or has been removed.</p>
        <button onClick={() => router.push('/')} className="primary-button">
          Go Back Home
        </button>
      </div>
    )
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="site-title">interestingto.me</h1>
          <button onClick={() => router.push('/profile')} className="back-button">
            Back to My Profile
          </button>
        </div>
      </header>
      
      {/* Two-column layout for viewed profile */}
      <div className="two-column-layout">
        {/* Left sidebar with user info and topics */}
        <div className="user-view-sidebar">
          {/* User Profile Card */}
          <div className="viewed-profile-card">
            <div className="viewed-profile-header">
              <div className="viewed-profile-pic">
                {viewedProfile?.profilePic ? (
                  <img 
                    src={viewedProfile.profilePic} 
                    alt={`${viewedProfile.displayName}'s profile`} 
                    className="profile-pic-large"
                  />
                ) : (
                  <div className="profile-pic-placeholder-large">
                    {viewedProfile?.displayName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="viewed-profile-info">
                <h2 className="viewed-profile-name">{viewedProfile?.displayName}</h2>
              </div>
            </div>
            
            {viewedProfile?.bio && (
              <div className="viewed-profile-bio">
                <p>{viewedProfile.bio}</p>
              </div>
            )}
          </div>
          
          {/* Topics list */}
          <div className="viewed-topics-container">
            <h3 className="sidebar-title">Topics</h3>
            {topics.length > 0 ? (
              <ul className="viewed-topics-list">
                <li 
                  className={`viewed-topic-item ${activeSection === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveSection('profile')}
                >
                  Recent Notes
                </li>
                {topics.map(topic => (
                  <li 
                    key={topic.id}
                    className={`viewed-topic-item ${activeSection === `topic-${topic.id}` ? 'active' : ''}`}
                    onClick={() => setActiveSection(`topic-${topic.id}`)}
                  >
                    {topic.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No topics yet.</p>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="user-view-content">
          {activeSection === 'profile' ? (
            /* Recent notes view */
            <div className="recent-notes-container">
              <h2 className="content-title">Recent Notes</h2>
              
              {viewedProfile?.notes && viewedProfile.notes.length > 0 ? (
                <div className="notes-list">
                  {viewedProfile.notes
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((note) => (
                      <div key={note.id} className="note-item">
                        <div className="note-container">
                          <div className="note-avatar">
                            {note.profilePic ? (
                              <img 
                                src={note.profilePic} 
                                alt={`${note.author}'s avatar`}
                                className="avatar-image"
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                {note.author ? note.author.charAt(0).toUpperCase() : '?'}
                              </div>
                            )}
                          </div>
                          <div className="note-content-wrapper">
                            <div className="note-header">
                              <span className="note-author">{note.author}</span>
                              <span className="note-date">{new Date(note.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="note-content">{note.content}</p>
                            
                            {/* Show topic tag if note has a topic */}
                            {note.topicId && (
                              <div className="note-topic-tag">
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
                    ))
                  }
                </div>
              ) : (
                <p className="empty-state">No notes yet.</p>
              )}
            </div>
          ) : (
            /* Topic Content View */
            <TopicContent 
              topicId={activeSection.replace('topic-', '')} 
              userId={currentUser?.uid} 
            />
          )}
        </div>
      </div>
    </div>
  )
}