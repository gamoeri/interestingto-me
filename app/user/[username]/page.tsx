'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function UserProfilePage({ params }) {
  const router = useRouter()
  const { username } = params
  const [currentUser, setCurrentUser] = useState(null)
  const [viewedProfile, setViewedProfile] = useState(null)
  const [userNotes, setUserNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Check auth and fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Check if logged in
      const authUser = auth.currentUser
      if (!authUser) {
        router.push('/signin')
        return
      }
      
      setCurrentUser(authUser)
      
      try {
        // Check if this is the current user
        const currentUserDoc = await getDoc(doc(db, 'users', authUser.uid))
        if (currentUserDoc.exists()) {
          const userData = currentUserDoc.data()
          if (userData.displayName === username) {
            // Viewing own profile, redirect to personal view
            router.push('/profile')
            return
          }
        }
        
        // Find user by username
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
        
        // Get the user profile
        const userDoc = usersSnapshot.docs[0]
        const userData = userDoc.data()
        setViewedProfile(userData)
        
        // Get their notes
        const notesQuery = query(
          collection(db, 'notes'),
          where('authorId', '==', userDoc.id)
        )
        
        const notesSnapshot = await getDocs(notesQuery)
        const notesList = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setUserNotes(notesList)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
      
      setLoading(false)
    }
    
    fetchData()
  }, [username, router])

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
        <button onClick={() => router.push('/notes')} className="primary-button">
          Back to My Notes
        </button>
      </div>
    )
  }

  return (
    <div className="user-profile-view">
      {/* User Banner */}
      <div 
        className="profile-banner" 
        style={{ backgroundImage: `url(${viewedProfile?.bannerImage || '/default-banner.jpg'})` }}
      >
        <div className="profile-info-container">
          <div className="profile-pic-container">
            {viewedProfile?.profilePic ? (
              <img 
                src={viewedProfile.profilePic} 
                alt={`${viewedProfile.displayName}'s profile`}
                className="profile-pic"
              />
            ) : (
              <div className="profile-pic-placeholder">
                {viewedProfile?.displayName ? viewedProfile.displayName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* User Info */}
      <div className="user-profile-header">
        <div className="profile-info-container">
          <h2 className="profile-name">{viewedProfile?.displayName || 'User'}</h2>
          <p className="profile-bio">{viewedProfile?.bio || 'No bio yet.'}</p>
        </div>
        
        <div className="profile-action-buttons">
          <button 
            className="view-topics-button"
            onClick={() => router.push(`/user/${username}/topics`)}
          >
            View Topics
          </button>
          <button 
            className="view-bookmarks-button"
            onClick={() => router.push(`/user/${username}/bookmarks`)}
          >
            View Bookmarks
          </button>
        </div>
      </div>
      
      {/* User's Notes */}
      <div className="user-notes-container">
        <h3>Recent Notes</h3>
        
        {userNotes.length > 0 ? (
          <div className="user-notes-list">
            {userNotes
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 5) // Just show most recent 5
              .map((note) => (
                <div key={note.id} className="note-item">
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
          <p className="empty-notes">This user hasn't posted any notes yet.</p>
        )}
      </div>
    </div>
  )
}